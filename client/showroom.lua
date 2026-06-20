Showroom = {}

local cam = Config.Client.camera
local ctrl = Config.Client.controls

local active = false
local dealership
local preview
local restoreCoords
local restoreHeading
local PAINT <const> = { gloss = 0, metallic = 1, pearl = 2, matte = 3 }

local state = {
    heading = 0.0,
    targetHeading = 0.0,
    pitch = cam.pitch,
    distance = cam.distance,
    camHandle = nil,
    finish = 'gloss',
    pearl = 0,
    colorPrimary = { r = 120, g = 0, b = 0 },
    colorSecondary = { r = 20, g = 20, b = 20 },
}

local function applyColor()
    if not preview or not DoesEntityExist(preview) then return end
    local pt = PAINT[state.finish] or 0
    SetVehicleModKit(preview, 0)
    SetVehicleModColor_1(preview, pt, 0, 0)
    SetVehicleModColor_2(preview, pt, 0)
    SetVehicleCustomPrimaryColour(preview, state.colorPrimary.r, state.colorPrimary.g, state.colorPrimary.b)
    SetVehicleCustomSecondaryColour(preview, state.colorSecondary.r, state.colorSecondary.g, state.colorSecondary.b)
    local _, wheel = GetVehicleExtraColours(preview)
    SetVehicleExtraColours(preview, state.pearl, wheel)
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

function Showroom.setFinish(finish)
    if PAINT[finish] == nil then return end
    state.finish = finish
    applyColor()
end

function Showroom.getFinish()
    return state.finish
end

function Showroom.setPearl(index)
    if type(index) ~= 'number' or index < 0 or index > 160 then return end
    state.pearl = math.floor(index)
    applyColor()
end

function Showroom.getPearl()
    return state.pearl
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

    DoScreenFadeOut(400)
    local fadeStart = GetGameTimer()
    while not IsScreenFadedOut() and GetGameTimer() - fadeStart < 1200 do Wait(0) end

    lib.callback.await('whereiaml_vehicleshop:enterStudio', false)

    local ped = cache.ped or PlayerPedId()
    restoreCoords = GetEntityCoords(ped)
    restoreHeading = GetEntityHeading(ped)

    local p = dealership.studio.podium
    local s = dealership.studio.ped
    SetEntityCoords(ped, s.x, s.y, s.z, false, false, false, false)

    RequestCollisionAtCoord(p.x, p.y, p.z)
    local loadStart = GetGameTimer()
    while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() - loadStart < 5000 do
        RequestCollisionAtCoord(p.x, p.y, p.z)
        Wait(10)
    end

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

    Wait(150)
    DoScreenFadeIn(500)
end

function Showroom.close()
    if not active then return end
    active = false

    DoScreenFadeOut(300)
    local fadeStart = GetGameTimer()
    while not IsScreenFadedOut() and GetGameTimer() - fadeStart < 800 do Wait(0) end

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
        SetEntityHeading(ped, restoreHeading or 0.0)
    end

    lib.callback.await('whereiaml_vehicleshop:exitStudio', false)

    Wait(100)
    DoScreenFadeIn(400)
end

function Showroom.isActive()
    return active
end

AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and active then
        Showroom.close()
    end
end)
