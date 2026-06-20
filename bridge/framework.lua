Framework = {}

local function detect()
    if GetResourceState('qbx_core') == 'started' then return 'qbx' end
    if GetResourceState('es_extended') == 'started' then return 'esx' end
    return 'unknown'
end

Framework.name = detect()

local isServer = IsDuplicityVersion()

if Framework.name == 'esx' then
    Framework.esx = exports.es_extended:getSharedObject()
end

if not isServer then
    function Framework.Notify(msg, type)
        if Framework.name == 'qbx' then
            exports.qbx_core:Notify(msg, type)
        elseif Framework.name == 'esx' then
            Framework.esx.ShowNotification(msg)
        else
            lib.notify({ description = msg, type = type })
        end
    end
    return
end

function Framework.Notify(src, msg, type)
    if Framework.name == 'qbx' then
        exports.qbx_core:Notify(src, msg, type)
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromId(src)
        if xPlayer then xPlayer.showNotification(msg) end
    end
end

function Framework.GetCitizenId(src)
    if Framework.name == 'qbx' then
        local player = exports.qbx_core:GetPlayer(src)
        return player and player.PlayerData.citizenid
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier
    end
end

---@return table<string, {name:string, brand:string, price:number, category:string}>?
function Framework.GetCatalog()
    if Framework.name == 'qbx' then
        return exports.qbx_core:GetVehiclesByName()
    end
    return nil
end

---@return number
function Framework.GetMoney(src, moneyType)
    if Framework.name == 'qbx' then
        local player = exports.qbx_core:GetPlayer(src)
        return player and player.Functions.GetMoney(moneyType) or 0
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromId(src)
        if not xPlayer then return 0 end
        return xPlayer.getAccount(moneyType == 'cash' and 'money' or moneyType).money
    end
    return 0
end

---@return boolean
function Framework.RemoveMoney(src, moneyType, amount, reason)
    if Framework.name == 'qbx' then
        local player = exports.qbx_core:GetPlayer(src)
        return player and player.Functions.RemoveMoney(moneyType, amount, reason) or false
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromId(src)
        if not xPlayer then return false end
        local account = moneyType == 'cash' and 'money' or moneyType
        if xPlayer.getAccount(account).money < amount then return false end
        xPlayer.removeAccountMoney(account, amount)
        return true
    end
    return false
end

function Framework.AddMoney(src, moneyType, amount, reason)
    if Framework.name == 'qbx' then
        local player = exports.qbx_core:GetPlayer(src)
        return player and player.Functions.AddMoney(moneyType, amount, reason) or false
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromId(src)
        if not xPlayer then return false end
        xPlayer.addAccountMoney(moneyType == 'cash' and 'money' or moneyType, amount)
        return true
    end
    return false
end

---@param src number
---@param model string
---@param props table ox_lib vehicle properties (color1/color2 = {r,g,b})
---@return integer? vehicleId
function Framework.GiveVehicle(src, model, props)
    local citizenid = Framework.GetCitizenId(src)
    if not citizenid then return nil end
    if Framework.name == 'qbx' then
        local vehicleId = exports.qbx_vehicles:CreatePlayerVehicle({
            model = model,
            citizenid = citizenid,
            props = props,
        })
        return vehicleId
    elseif Framework.name == 'esx' then
        local plate = props.plate or ('WL' .. math.random(1000, 9999))
        MySQL.insert.await('INSERT INTO owned_vehicles (owner, plate, vehicle, type) VALUES (?, ?, ?, ?)', {
            citizenid, plate, json.encode(props), 'car',
        })
        return plate
    end
    return nil
end

function Framework.GetSrcByCitizenId(citizenid)
    if Framework.name == 'qbx' then
        local player = exports.qbx_core:GetPlayerByCitizenId(citizenid)
        return player and player.PlayerData.source
    elseif Framework.name == 'esx' then
        local xPlayer = Framework.esx.GetPlayerFromIdentifier(citizenid)
        return xPlayer and xPlayer.source
    end
end

---@param vehicleId integer|string
---@param owner? string nil to repossess
function Framework.SetVehicleOwner(vehicleId, owner)
    if Framework.name == 'qbx' then
        local id = tonumber(vehicleId)
        if owner == nil then
            exports.qbx_vehicles:DeletePlayerVehicles('vehicleId', id)
        else
            exports.qbx_vehicles:SetPlayerVehicleOwner(id, owner)
        end
    elseif Framework.name == 'esx' then
        if owner == nil then
            MySQL.update('DELETE FROM owned_vehicles WHERE plate = ?', { vehicleId })
        else
            MySQL.update('UPDATE owned_vehicles SET owner = ? WHERE plate = ?', { owner, vehicleId })
        end
    end
end
