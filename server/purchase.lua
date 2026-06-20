Catalog = {}

local list
local index

local function build()
    local out = {}
    local fw = Config.CatalogSource == 'framework' and Framework.GetCatalog() or nil
    if fw then
        for model, v in pairs(fw) do
            out[#out + 1] = {
                model = model,
                name = v.name,
                brand = v.brand,
                price = v.price,
                category = v.category,
            }
        end
    else
        for i = 1, #Config.Catalog do
            local v = Config.Catalog[i]
            out[#out + 1] = {
                model = v.model,
                name = v.name,
                brand = v.brand,
                price = v.price,
                category = v.category,
                image = v.image,
            }
        end
    end
    table.sort(out, function(a, b) return a.name < b.name end)
    return out
end

function Catalog.get()
    if not list then list = build() end
    return list
end

function Catalog.entry(model)
    if not index then
        index = {}
        local l = Catalog.get()
        for i = 1, #l do index[l[i].model] = l[i] end
    end
    return index[model]
end

local busy = {}
local cooldown = {}

local function validColor(c)
    return type(c) == 'table'
        and type(c.r) == 'number' and c.r >= 0 and c.r <= 255
        and type(c.g) == 'number' and c.g >= 0 and c.g <= 255
        and type(c.b) == 'number' and c.b >= 0 and c.b <= 255
end

local function getDealership(dealershipId)
    for i = 1, #Config.Dealerships do
        if Config.Dealerships[i].id == dealershipId then return Config.Dealerships[i] end
    end
end

lib.callback.register('whereiaml_vehicleshop:purchase', function(source, data)
    local src = source
    if busy[src] then return { ok = false } end

    local now = GetGameTimer()
    if cooldown[src] and now - cooldown[src] < Config.Server.antiAbuse.purchaseCooldown then
        return { ok = false }
    end
    cooldown[src] = now

    if type(data) ~= 'table' or type(data.model) ~= 'string' or type(data.dealership) ~= 'string' then
        return { ok = false }
    end

    local payment = data.payment
    local allowed = false
    for i = 1, #Config.Server.paymentMethods do
        if Config.Server.paymentMethods[i] == payment then allowed = true break end
    end
    if not allowed then return { ok = false } end
    if payment == 'finance' and not Config.Server.finance.enabled then return { ok = false } end

    local entry = Catalog.entry(data.model)
    if not entry then return { ok = false } end

    local dealership = getDealership(data.dealership)
    if not dealership then
        return { ok = false }
    end

    busy[src] = true
    local ok, result = pcall(function()
        local price = entry.price
        local props = { model = data.model }
        if validColor(data.colorPrimary) then
            props.color1 = { data.colorPrimary.r, data.colorPrimary.g, data.colorPrimary.b }
        end
        if validColor(data.colorSecondary) then
            props.color2 = { data.colorSecondary.r, data.colorSecondary.g, data.colorSecondary.b }
        end

        if payment == 'finance' then
            local cfg = Config.Server.finance
            local down = math.floor(price * cfg.minDownPercent / 100)
            if not Framework.RemoveMoney(src, cfg.downPaymentFrom, down, 'vehicleshop-down') then
                return { ok = false, reason = 'not_enough_money' }
            end
            local vehicleId, plate = Framework.GiveVehicle(src, data.model, props)
            if not vehicleId then
                Framework.AddMoney(src, cfg.downPaymentFrom, down, 'vehicleshop-refund')
                return { ok = false, reason = 'vehicle_failed' }
            end
            Finance.create(Framework.GetCitizenId(src), vehicleId, price - down)
            Framework.SpawnOwnedVehicle(src, data.model, plate, dealership.spawn, vehicleId)
            Framework.Notify(src, locale('purchase_financed', entry.name), 'success')
            return { ok = true }
        end

        if not Framework.RemoveMoney(src, payment, price, 'vehicleshop-purchase') then
            return { ok = false, reason = 'not_enough_money' }
        end
        local vehicleId, plate = Framework.GiveVehicle(src, data.model, props)
        if not vehicleId then
            Framework.AddMoney(src, payment, price, 'vehicleshop-refund')
            return { ok = false, reason = 'vehicle_failed' }
        end
        Framework.SpawnOwnedVehicle(src, data.model, plate, dealership.spawn, vehicleId)
        Framework.Notify(src, locale('purchase_success', entry.name), 'success')
        return { ok = true }
    end)

    busy[src] = nil

    if not ok then return { ok = false } end
    if result.reason == 'not_enough_money' then
        Framework.Notify(src, locale('not_enough_money'), 'error')
    elseif result.reason == 'vehicle_failed' then
        Framework.Notify(src, locale('vehicle_failed'), 'error')
    end
    return result
end)

AddEventHandler('playerDropped', function()
    local src = source
    busy[src] = nil
    cooldown[src] = nil
end)
