-- whereiaml_vehicleshop server config
-- Payment, finance and anti-abuse. Server-authoritative; never trust the client.

Config.Server = {
    -- Which payment methods are offered. Order is preserved in the UI.
    -- 'cash' / 'bank' map to framework money types. 'finance' enables loans below.
    paymentMethods = { 'cash', 'bank', 'finance' },

    -- How a purchased vehicle is delivered:
    --   'world'  -> spawned in the real world at the dealership `spawn` point (see config/shared.lua).
    --               The spawn point is occupancy-checked, so cars never stack on top of each other.
    --   'garage' -> sent straight to a garage. No world spawn; the player retrieves it from the garage.
    delivery = 'world',

    -- Garage the vehicle is deposited into when delivery = 'garage'.
    -- QBox: must be a garage id from your qbx_garages config (e.g. 'motelgarage', 'sapcounsel').
    --       A per-dealership `garage` field in config/shared.lua overrides this.
    -- ESX:  requires a `stored` column on the owned_vehicles table (standard on most ESX garages);
    --       the value here is unused and the vehicle is simply stored.
    garage = 'motelgarage',

    -- Allow bank payments to overdraw into a negative balance.
    -- false (recommended) = the purchase/installment is blocked if the bank balance is too low.
    -- true = the player can go into the minus.
    allowBankOverdraft = false,

    finance = {
        enabled = true,
        minDownPercent = 20,   -- minimum down payment (% of price) the buyer must pay up front
        interestPercent = 10,  -- total interest added to the financed amount
        maxPayments = 12,      -- number of installments to pay off the balance
        -- ox_lib cron expression for collecting payments. Default: every Sunday 00:00.
        -- https://overextended.dev/ox_lib/Modules/Cron
        paymentCron = '0 0 * * 0',
        -- Missed payments allowed before the vehicle is repossessed.
        maxMissedPayments = 3,
        downPaymentFrom = 'bank', -- money type used for the down payment ('cash' or 'bank')
        installmentFrom = 'bank', -- money type installments are charged from
    },

    -- Anti-abuse.
    antiAbuse = {
        purchaseCooldown = 2000,   -- ms between purchase attempts per player
    },

    -- Plate format passed to the framework when creating the vehicle.
    -- Letters become random uppercase, digits become random numbers.
    plateFormat = 'WL11111',
}
