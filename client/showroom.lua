Showroom = {}

local cam = Config.Client.camera
local ctrl = Config.Client.controls

local active = false
local dealership
local preview
local restoreCoords
local state = {
    heading = 0.0,
    targetHeading = 0.0,
    pitch = cam.pitch,
    distance = cam.distance,
    camHandle = nil,
    colorPrimary = { r = 120, g = 0, b = 0 },
    colorSecondary = { r = 20, g = 20, b = 20 },
}

local function applyColor()
    if not preview or not DoesEntityExist(preview) then return end
    SetVehicleModKit(preview, 0)
    SetVehicleCustomPrimaryColour(preview, state.colorPrimary.r, state.colorPrimary.g, state.colorPrimary.b)
    SetVehicleCustomSecondaryColour(preview, state.colorSecondary.r, state.colorSecondary.g, state.colorSecondary.b)
end

local function center()
    local p = dealership.studio.podium
    return vec3(p.x, p.y, p.z)
end

local function updateCam()
    if not state.camHandle then return end
    local c = center()
    local rad = math.rad(state.pitch)
    local horiz = state.distance * math.cos(rad)
    local x = c.x
    local y = c.y - horiz
    local z = c.z + cam.height + state.distance * -math.sin(rad)
    SetCamCoord(state.camHandle, x, y, z)
    PointCamAtCoord(state.camHandle, c.x, c.y, c.z + cam.height * 0.5)
end

local function spawnPreview(model)
    local hash = joaat(model)
    if not lib.requestModel(hash, 10000) then return false end
    if preview and DoesEntityExist(preview) then DeleteEntity(preview) end
    local p = dealership.studio.podium
    preview = CreateVehicle(hash, p.x, p.y, p.z, p.w, false, false)
    SetModelAsNoLongerNeeded(hash)
    SetEntityInvincible(preview, true)
    SetVehicleDoorsShut(preview, true)
    SetVehicleOnGroundProperly(preview)
    FreezeEntityPosition(preview, true)
    SetEntityCollision(preview, false, false)
    state.heading = p.w + 0.0
    state.targetHeading = p.w + 0.0
    SetEntityHeading(preview, state.heading)
    applyColor()
    return true
end

local function renderLoop()
    CreateThread(function()
        while active do
            if preview and DoesEntityExist(preview) then
                local diff = state.targetHeading - state.heading
                while diff > 180 do diff = diff - 360 end
                while diff < -180 do diff = diff + 360 end
                state.heading = state.heading + diff * ctrl.rotateLerp
                SetEntityHeading(preview, state.heading)
            end
            updateCam()
            Wait(0)
        end
    end)
end

function Showroom.rotate(dx, dy)
    if not active then return end
    state.targetHeading = state.targetHeading - dx * ctrl.rotateSpeed
    state.pitch = math.max(cam.minPitch, math.min(cam.maxPitch, state.pitch - dy * ctrl.pitchSpeed))
end

function Showroom.zoom(delta)
    if not active then return end
    state.distance = math.max(cam.minDistance, math.min(cam.maxDistance, state.distance - delta * ctrl.zoomSpeed))
end

function Showroom.setColor(slot, color)
    if slot == 'secondary' then
        state.colorSecondary = color
    else
        state.colorPrimary = color
    end
    applyColor()
end

function Showroom.setModel(model)
    spawnPreview(model)
end

function Showroom.setDoor(doorIndex, open)
    if not preview or not DoesEntityExist(preview) then return end
    if open then
        SetVehicleDoorOpen(preview, doorIndex, false, false)
    else
        SetVehicleDoorShut(preview, doorIndex, false)
    end
end

function Showroom.getColors()
    return state.colorPrimary, state.colorSecondary
end

function Showroom.getDealership()
    return dealership
end

function Showroom.open(d, firstModel)
    if active then return end
    dealership = d
    active = true

    local ped = cache.ped or PlayerPedId()
    restoreCoords = GetEntityCoords(ped)
    local s = dealership.studio.ped
    SetEntityCoords(ped, s.x, s.y, s.z, false, false, false, false)
    FreezeEntityPosition(ped, true)
    SetEntityVisible(ped, false, false)

    state.pitch = cam.pitch
    state.distance = cam.distance
    state.camHandle = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
    SetCamFov(state.camHandle, cam.fov)
    updateCam()
    RenderScriptCams(true, false, 0, true, false)

    spawnPreview(firstModel)
    renderLoop()
end

function Showroom.close()
    if not active then return end
    active = false

    if preview and DoesEntityExist(preview) then DeleteEntity(preview) end
    preview = nil

    RenderScriptCams(false, false, 0, true, false)
    if state.camHandle then
        DestroyCam(state.camHandle, false)
        state.camHandle = nil
    end

    local ped = cache.ped or PlayerPedId()
    SetEntityVisible(ped, true, false)
    FreezeEntityPosition(ped, false)
    if restoreCoords then
        SetEntityCoords(ped, restoreCoords.x, restoreCoords.y, restoreCoords.z, false, false, false, false)
    end
end

function Showroom.isActive()
    return active
end

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and active then
        Showroom.close()
    end
end)
