lib.locale()

local peds = {}
local blips = {}

local function createBlip(d)
    if not d.blip or not d.blip.enabled then return end
    local blip = AddBlipForCoord(d.coords.x, d.coords.y, d.coords.z)
    SetBlipSprite(blip, d.blip.sprite)
    SetBlipColour(blip, d.blip.color)
    SetBlipScale(blip, d.blip.scale)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(d.label)
    EndTextCommandSetBlipName(blip)
    blips[#blips + 1] = blip
end

local function createPed(d)
    local hash = joaat(d.ped)
    if not lib.requestModel(hash, 10000) then return end
    local ped = CreatePed(0, hash, d.coords.x, d.coords.y, d.coords.z, d.coords.w, false, false)
    SetModelAsNoLongerNeeded(hash)
    SetEntityInvincible(ped, true)
    FreezeEntityPosition(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    peds[#peds + 1] = ped

    exports.ox_target:addLocalEntity(ped, {
        {
            name = 'whereiaml_vehicleshop_open',
            icon = 'fas fa-car',
            label = locale('target_browse'),
            distance = 2.5,
            onSelect = function()
                OpenShop(d)
            end,
        },
    })
end

local function spawnAll()
    for i = 1, #Config.Dealerships do
        createPed(Config.Dealerships[i])
        createBlip(Config.Dealerships[i])
    end
end

local function clearAll()
    for i = 1, #peds do
        if DoesEntityExist(peds[i]) then DeleteEntity(peds[i]) end
    end
    for i = 1, #blips do RemoveBlip(blips[i]) end
    peds = {}
    blips = {}
end

CreateThread(spawnAll)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    if #peds == 0 then spawnAll() end
end)

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() then clearAll() end
end)
