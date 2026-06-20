-- whereiaml_vehicleshop shared config
-- Shared between client and server. Defines dealerships, categories and the catalog.
-- Everything here is safe for the client to know (it is sent to the UI anyway).

Config = {}

-- Locale key (loaded from locales/<locale>.json). Set the ox_lib convar `ox:locale`
-- to switch language globally; this is only a fallback default.
Config.Locale = 'en'

-- Set true to print debug logs (kept false in production).
Config.Debug = false

-- Vehicle categories shown as tabs in the UI, in this order.
-- `id` must match the category used in Config.Catalog entries.
-- `label` is the tab text. `icon` is a Tabler icon name (Mantine uses Tabler icons).
Config.Categories = {
    { id = 'compacts',   label = 'Compacts',   icon = 'car' },
    { id = 'sedans',     label = 'Sedans',     icon = 'car' },
    { id = 'suvs',       label = 'SUVs',       icon = 'car-suv' },
    { id = 'sports',     label = 'Sports',     icon = 'steering-wheel' },
    { id = 'super',      label = 'Super',      icon = 'rocket' },
    { id = 'muscle',     label = 'Muscle',     icon = 'engine' },
    { id = 'offroad',    label = 'Off-road',   icon = 'mountain' },
    { id = 'motorcycles',label = 'Motorcycles',icon = 'motorbike' },
}

-- Catalog source:
--   'framework' -> pull vehicles + prices from the framework (QBox: GetVehiclesByName).
--                  On QBox the category is taken from the framework vehicle data.
--   'config'    -> use the Config.Catalog list below (required on ESX, optional on QBox).
-- If 'framework' is selected but the framework has no catalog (ESX), it falls back to 'config'.
Config.CatalogSource = 'framework'

-- Manual catalog. Used when Config.CatalogSource = 'config' (or as ESX fallback).
-- model:    spawn name (must exist on the server/stream).
-- name:     display name. brand: display brand. price: full price.
-- category: must match a Config.Categories id.
-- image:    optional. nui:// url or https url for a thumbnail. Leave nil for a clean text card.
Config.Catalog = {
    { model = 'blista',  name = 'Blista',  brand = 'Dinka',     price = 16000,  category = 'compacts' },
    { model = 'asea',    name = 'Asea',    brand = 'Declasse',  price = 12000,  category = 'sedans' },
    { model = 'baller',  name = 'Baller',  brand = 'Gallivanter',price = 95000, category = 'suvs' },
    { model = 'sultan',  name = 'Sultan',  brand = 'Karin',     price = 45000,  category = 'sports' },
    { model = 'adder',   name = 'Adder',   brand = 'Truffade',  price = 1000000,category = 'super' },
    { model = 'dominator',name= 'Dominator',brand= 'Vapid',     price = 38000,  category = 'muscle' },
    { model = 'sandking',name = 'Sandking',brand = 'Vapid',     price = 58000,  category = 'offroad' },
    { model = 'akuma',   name = 'Akuma',   brand = 'Dinka',     price = 9000,   category = 'motorcycles' },
}

-- Dealerships placed in the world. Add as many as you want.
-- ped:      dealer ped model. coords: vec4 (x,y,z,heading) for the ped + interaction.
-- blip:     map blip (set enabled=false to hide). categories: which category ids this
--           dealership sells (nil = all categories).
-- studio:   hidden showroom location the player is teleported to while browsing.
--           podium = vec4 where the preview vehicle is placed (heading is its start facing).
-- spawn:    vec4 where a purchased / test-drive vehicle is delivered in the real world.
Config.Dealerships = {
    {
        id = 'pdm',
        label = 'Premium Deluxe Motorsport',
        ped = 'a_m_y_business_01',
        coords = vec4(-56.51, -1096.6, 26.42, 25.0),
        blip = { enabled = true, sprite = 326, color = 3, scale = 0.8 },
        categories = nil,
        studio = {
            podium = vec4(-1395.0, -3000.0, 13.95, 240.0),
            ped = vec3(-1398.5, -3002.5, 13.95),
        },
        spawn = vec4(-44.27, -1098.0, 26.42, 70.0),
    },
}

-- Door slots exposed in the UI. doorIndex maps to GTA vehicle door indices:
-- 0 front-left, 1 front-right, 2 rear-left, 3 rear-right, 4 hood, 5 trunk.
Config.Doors = {
    { doorIndex = 4, label = 'Hood' },
    { doorIndex = 5, label = 'Trunk' },
    { doorIndex = 0, label = 'Door FL' },
    { doorIndex = 1, label = 'Door FR' },
    { doorIndex = 2, label = 'Door RL' },
    { doorIndex = 3, label = 'Door RR' },
}
