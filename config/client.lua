-- whereiaml_vehicleshop client config
-- Camera, mouse controls and test-drive behavior. Tune to taste.

Config.Client = {
    -- Showroom camera (orbit around the preview vehicle).
    camera = {
        fov = 50.0,            -- field of view
        distance = 5.5,        -- starting distance from the vehicle
        minDistance = 3.0,     -- closest zoom
        maxDistance = 9.0,     -- farthest zoom
        height = 1.0,          -- camera height offset above the vehicle origin
        pitch = -10.0,         -- starting vertical angle (degrees, negative looks down)
        minPitch = -60.0,
        maxPitch = 20.0,
        startHeading = 40.0,   -- preview vehicle starting facing relative to camera
        interpTime = 800,      -- ms for the entry camera blend
    },

    -- Mouse interaction. Higher = more movement per pixel.
    controls = {
        rotateSpeed = 0.22,    -- horizontal drag -> vehicle rotation
        pitchSpeed = 0.2,      -- vertical drag -> camera pitch
        zoomSpeed = 0.6,       -- scroll wheel -> zoom
        rotateLerp = 0.16,     -- 0..1 smoothing of the vehicle rotation
    },

    -- Test drive.
    testDrive = {
        duration = 45,         -- seconds before the vehicle is auto-returned
        returnToShop = true,   -- after the test drive, reopen the dealership so the player can keep browsing
    },
}
