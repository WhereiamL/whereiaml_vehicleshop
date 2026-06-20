TestDrive = {}

local cfg = Config.Client.testDrive
local PAINT <const> = { gloss = 0, metallic = 1, pearl = 2, matte = 3 }
local active = false
local veh
local dealershipRef

local function clearUI()
    SendNUIMessage({ action = 'testdrive', state = 'stop' })
end

function TestDrive.stop()
    if not active then return end
    active = false
    clearUI()

    local ped = cache.ped or PlayerPedId()
    if veh and DoesEntityExist(veh) then DeleteEntity(veh) end
    veh = nil

    local d = dealershipRef
    if d then
        SetEntityCoords(ped, d.coords.x, d.coords.y, d.coords.z, false, false, false, false)
        SetEntityHeading(ped, d.coords.w)
    end

    if cfg.returnToShop and d then
        OpenShop(d)
    else
        ShopNotify('inform', locale('testdrive_over'))
    end
end

function TestDrive.start(model, dealership, colorPrimary, colorSecondary, finish)
    if active then return false end

    local hash = joaat(model)
    if not lib.requestModel(hash, 10000) then
        ShopNotify('error', locale('testdrive_failed'))
        return false
    end

    active = true
    dealershipRef = dealership

    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    Showroom.close()

    local sp = dealership.testdrive or dealership.spawn
    veh = CreateVehicle(hash, sp.x, sp.y, sp.z, sp.w, true, false)
    SetModelAsNoLongerNeeded(hash)
    SetEntityAsMissionEntity(veh, true, true)
    SetVehicleModKit(veh, 0)
    SetVehicleDirtLevel(veh, 0.0)
    local pt = PAINT[finish] or 0
    SetVehicleModColor_1(veh, pt, 0, 0)
    SetVehicleModColor_2(veh, pt, 0)
    if colorPrimary then SetVehicleCustomPrimaryColour(veh, colorPrimary.r, colorPrimary.g, colorPrimary.b) end
    if colorSecondary then SetVehicleCustomSecondaryColour(veh, colorSecondary.r, colorSecondary.g, colorSecondary.b) end

    local ped = cache.ped or PlayerPedId()
    SetPedIntoVehicle(ped, veh, -1)
    SetVehicleEngineOn(veh, true, true, false)

    SendNUIMessage({ action = 'testdrive', state = 'start', total = cfg.duration, seconds = cfg.duration })

    CreateThread(function()
        local endAt = GetGameTimer() + cfg.duration * 1000
        local lastSec
        while active do
            local remaining = math.ceil((endAt - GetGameTimer()) / 1000)
            if remaining <= 0 then break end
            if remaining ~= lastSec then
                lastSec = remaining
                SendNUIMessage({ action = 'testdrive', state = 'tick', total = cfg.duration, seconds = remaining })
            end
            if IsControlJustPressed(0, 73) or IsEntityDead(ped) then break end
            Wait(0)
        end
        TestDrive.stop()
    end)

    return true
end

function TestDrive.isActive()
    return active
end

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and active then
        TestDrive.stop()
    end
end)
