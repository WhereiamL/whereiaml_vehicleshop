TestDrive = {}

local cfg = Config.Client.testDrive
local active = false
local veh
local returnCoords

function TestDrive.stop()
    if not active then return end
    active = false
    lib.hideTextUI()

    local ped = cache.ped or PlayerPedId()
    if veh and DoesEntityExist(veh) then DeleteEntity(veh) end
    veh = nil

    if returnCoords then
        SetEntityCoords(ped, returnCoords.x, returnCoords.y, returnCoords.z, false, false, false, false)
        SetEntityHeading(ped, returnCoords.w)
    end
    Framework.Notify(locale('testdrive_over'), 'inform')
end

function TestDrive.start(model, dealership, colorPrimary, colorSecondary)
    if active then return end

    local hash = joaat(model)
    if not lib.requestModel(hash, 10000) then return end

    active = true
    returnCoords = dealership.coords

    local sp = dealership.spawn
    veh = CreateVehicle(hash, sp.x, sp.y, sp.z, sp.w, true, false)
    SetModelAsNoLongerNeeded(hash)
    SetVehicleModKit(veh, 0)
    if colorPrimary then SetVehicleCustomPrimaryColour(veh, colorPrimary.r, colorPrimary.g, colorPrimary.b) end
    if colorSecondary then SetVehicleCustomSecondaryColour(veh, colorSecondary.r, colorSecondary.g, colorSecondary.b) end

    local ped = cache.ped or PlayerPedId()
    SetPedIntoVehicle(ped, veh, -1)
    SetVehicleEngineOn(veh, true, true, false)

    CreateThread(function()
        local endAt = GetGameTimer() + cfg.duration * 1000
        local lastLabel
        while active do
            local remaining = math.ceil((endAt - GetGameTimer()) / 1000)
            if remaining <= 0 then break end
            if cfg.showTimer then
                local label = locale('testdrive_timer', remaining)
                if label ~= lastLabel then
                    lib.showTextUI(label, { position = 'top-center' })
                    lastLabel = label
                end
            end
            if IsControlJustPressed(0, 73) then break end
            Wait(0)
        end
        TestDrive.stop()
    end)
end

function TestDrive.isActive()
    return active
end

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and active then
        TestDrive.stop()
    end
end)
