Finance = {}

local cfg = Config.Server.finance

function Finance.create(citizenid, vehicleId, principal, label)
    local total = math.floor(principal * (1 + cfg.interestPercent / 100))
    local payment = math.ceil(total / cfg.maxPayments)
    MySQL.insert('INSERT INTO whereiaml_vehicleshop_finance (citizenid, vehicleid, label, balance, payment_amount, payments_left) VALUES (?, ?, ?, ?, ?, ?)', {
        citizenid, tostring(vehicleId), label or 'Vehicle', total, payment, cfg.maxPayments,
    })
    return total, payment
end

local function collect()
    local rows = MySQL.query.await('SELECT * FROM whereiaml_vehicleshop_finance')
    if not rows then return end

    for i = 1, #rows do
        local row = rows[i]
        local src = Framework.GetSrcByCitizenId(row.citizenid)
        if src then
            local pay = math.min(row.payment_amount, row.balance)
            local afford = cfg.installmentFrom ~= 'bank'
                or Config.Server.allowBankOverdraft
                or Framework.GetMoney(src, 'bank') >= pay
            if afford and Framework.RemoveMoney(src, cfg.installmentFrom, pay, 'vehicleshop-finance') then
                local balance = row.balance - pay
                local left = row.payments_left - 1
                if left <= 0 or balance <= 0 then
                    MySQL.update('DELETE FROM whereiaml_vehicleshop_finance WHERE id = ?', { row.id })
                    Framework.Notify(src, locale('finance_paid_off'), 'success')
                else
                    MySQL.update('UPDATE whereiaml_vehicleshop_finance SET balance = ?, payments_left = ?, missed = 0 WHERE id = ?', { balance, left, row.id })
                    Framework.Notify(src, locale('finance_charged', pay, balance), 'inform')
                end
            else
                local missed = row.missed + 1
                if missed >= cfg.maxMissedPayments then
                    Framework.SetVehicleOwner(row.vehicleid, nil)
                    MySQL.update('DELETE FROM whereiaml_vehicleshop_finance WHERE id = ?', { row.id })
                    Framework.Notify(src, locale('finance_repossessed'), 'error')
                else
                    MySQL.update('UPDATE whereiaml_vehicleshop_finance SET missed = ? WHERE id = ?', { missed, row.id })
                    Framework.Notify(src, locale('finance_missed', missed, cfg.maxMissedPayments), 'error')
                end
            end
        end
    end
end

if cfg.enabled then
    CreateThread(function()
        lib.cron.new(cfg.paymentCron, collect)
    end)
end

lib.callback.register('whereiaml_vehicleshop:getFinances', function(source)
    local citizenid = Framework.GetCitizenId(source)
    if not citizenid then return {} end
    return MySQL.query.await('SELECT id, label, balance, payment_amount, payments_left FROM whereiaml_vehicleshop_finance WHERE citizenid = ?', { citizenid }) or {}
end)

lib.callback.register('whereiaml_vehicleshop:payoff', function(source, financeId)
    if type(financeId) ~= 'number' then return { ok = false } end
    local citizenid = Framework.GetCitizenId(source)
    if not citizenid then return { ok = false } end

    local row = MySQL.single.await('SELECT * FROM whereiaml_vehicleshop_finance WHERE id = ? AND citizenid = ?', { financeId, citizenid })
    if not row then return { ok = false } end

    if cfg.installmentFrom == 'bank' and not Config.Server.allowBankOverdraft and Framework.GetMoney(source, 'bank') < row.balance then
        return { ok = false, reason = 'not_enough_money' }
    end
    if not Framework.RemoveMoney(source, cfg.installmentFrom, row.balance, 'vehicleshop-payoff') then
        return { ok = false, reason = 'not_enough_money' }
    end

    MySQL.update('DELETE FROM whereiaml_vehicleshop_finance WHERE id = ?', { row.id })
    return { ok = true }
end)
