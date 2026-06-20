lib.locale()

local DAYS <const> = { [0] = 'Sunday', [1] = 'Monday', [2] = 'Tuesday', [3] = 'Wednesday', [4] = 'Thursday', [5] = 'Friday', [6] = 'Saturday', [7] = 'Sunday' }

---Turns an ox_lib cron expression into a human-readable due description for the UI.
---@param cron string
---@return string
local function cronToHuman(cron)
    if type(cron) ~= 'string' then return 'on schedule' end
    local fields = {}
    for part in cron:gmatch('%S+') do fields[#fields + 1] = part end
    local min, hour, _, _, dow = fields[1], fields[2], fields[3], fields[4], fields[5]

    local time = ''
    if hour and hour:match('^%d+$') then
        time = (' at %02d:%02d'):format(tonumber(hour), tonumber(min) or 0)
    end

    if dow and dow ~= '*' then
        local d = tonumber(dow)
        if d and DAYS[d] then return ('every %s%s'):format(DAYS[d], time) end
    end
    return ('every day%s'):format(time)
end

CreateThread(function()
    local ok = pcall(function()
        MySQL.query.await([[CREATE TABLE IF NOT EXISTS `whereiaml_vehicleshop_finance` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `citizenid` VARCHAR(64) NOT NULL,
            `vehicleid` VARCHAR(64) NOT NULL,
            `balance` INT NOT NULL,
            `payment_amount` INT NOT NULL,
            `payments_left` INT NOT NULL,
            `missed` INT NOT NULL DEFAULT 0,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_citizenid` (`citizenid`),
            KEY `idx_vehicleid` (`vehicleid`)
        )]])
    end)
    if not ok and Config.Debug then
        lib.print.error('failed creating finance table')
    end
end)

lib.callback.register('whereiaml_vehicleshop:getData', function()
    local f = Config.Server.finance
    return {
        catalog = Catalog.get(),
        payments = Config.Server.paymentMethods,
        finance = {
            enabled = f.enabled,
            downPercent = f.minDownPercent,
            interestPercent = f.interestPercent,
            maxPayments = f.maxPayments,
            dueText = cronToHuman(f.paymentCron),
        },
    }
end)

lib.callback.register('whereiaml_vehicleshop:getMoney', function(source)
    return {
        cash = Framework.GetMoney(source, 'cash'),
        bank = Framework.GetMoney(source, 'bank'),
    }
end)

local STUDIO_BUCKET_BASE <const> = 6000
local inStudio = {}

local function leaveStudio(src)
    inStudio[src] = nil
    SetPlayerRoutingBucket(src, 0)
end

---@return boolean
function IsInStudio(src)
    return inStudio[src] == true
end

lib.callback.register('whereiaml_vehicleshop:enterStudio', function(source)
    inStudio[source] = true
    SetPlayerRoutingBucket(source, STUDIO_BUCKET_BASE + source)
    return true
end)

lib.callback.register('whereiaml_vehicleshop:exitStudio', function(source)
    leaveStudio(source)
    return true
end)

AddEventHandler('playerDropped', function()
    leaveStudio(source)
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    for _, id in ipairs(GetPlayers()) do
        local src = tonumber(id)
        if src and GetPlayerRoutingBucket(src) >= STUDIO_BUCKET_BASE then
            SetPlayerRoutingBucket(src, 0)
        end
    end
end)
