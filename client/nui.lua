local shopData

local function fetchData()
    if not shopData then
        shopData = lib.callback.await('whereiaml_vehicleshop:getData', false)
    end
    return shopData
end

local function filterCatalog(catalog, dealership)
    if not dealership.categories then return catalog end
    local allowed = {}
    for i = 1, #dealership.categories do allowed[dealership.categories[i]] = true end
    local out = {}
    for i = 1, #catalog do
        if allowed[catalog[i].category] then out[#out + 1] = catalog[i] end
    end
    return out
end

local function closeUI()
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    Showroom.close()
end

function OpenShop(dealership)
    if Showroom.isActive() or TestDrive.isActive() then return end

    local data = fetchData()
    local catalog = filterCatalog(data.catalog, dealership)
    if #catalog == 0 then return end

    Showroom.open(dealership, catalog[1].model)

    local cp, cs = Showroom.getColors()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        catalog = catalog,
        categories = Config.Categories,
        doors = Config.Doors,
        payments = data.payments,
        finance = data.finance,
        dealership = dealership.label,
        colors = { primary = cp, secondary = cs },
        selected = catalog[1].model,
    })
end

RegisterNUICallback('close', function(_, cb)
    cb(1)
    closeUI()
end)

RegisterNUICallback('rotate', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.dx) ~= 'number' or type(data.dy) ~= 'number' then return end
    Showroom.rotate(data.dx + 0.0, data.dy + 0.0)
end)

RegisterNUICallback('zoom', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.delta) ~= 'number' then return end
    Showroom.zoom(data.delta + 0.0)
end)

RegisterNUICallback('selectVehicle', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.model) ~= 'string' then return end
    Showroom.setModel(data.model)
end)

RegisterNUICallback('setColor', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.color) ~= 'table' then return end
    local c = data.color
    if type(c.r) ~= 'number' or type(c.g) ~= 'number' or type(c.b) ~= 'number' then return end
    Showroom.setColor(data.slot, { r = c.r, g = c.g, b = c.b })
end)

RegisterNUICallback('toggleDoor', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.doorIndex) ~= 'number' then return end
    Showroom.setDoor(data.doorIndex, data.open == true)
end)

RegisterNUICallback('setFinish', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.finish) ~= 'string' then return end
    Showroom.setFinish(data.finish)
end)

RegisterNUICallback('buy', function(data, cb)
    local dealership = Showroom.getDealership()
    local cp, cs = Showroom.getColors()
    local res = lib.callback.await('whereiaml_vehicleshop:purchase', false, {
        model = data.model,
        payment = data.payment,
        dealership = dealership.id,
        colorPrimary = cp,
        colorSecondary = cs,
        finish = Showroom.getFinish(),
    })
    cb(res or { ok = false })
    if res and res.ok then closeUI() end
end)

RegisterNUICallback('testDrive', function(data, cb)
    cb(1)
    if type(data) ~= 'table' or type(data.model) ~= 'string' then return end
    local dealership = Showroom.getDealership()
    local cp, cs = Showroom.getColors()
    TestDrive.start(data.model, dealership, cp, cs, Showroom.getFinish())
end)

RegisterNUICallback('getFinances', function(_, cb)
    cb(lib.callback.await('whereiaml_vehicleshop:getFinances', false))
end)

RegisterNUICallback('payoff', function(data, cb)
    cb(lib.callback.await('whereiaml_vehicleshop:payoff', false, data.id))
end)
