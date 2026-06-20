-- whereiaml_vehicleshop server config
-- Payment, finance and anti-abuse. Server-authoritative; never trust the client.

Config.Server = {
    -- Which payment methods are offered. Order is preserved in the UI.
    -- 'cash' / 'bank' map to framework money types. 'finance' enables loans below.
    paymentMethods = { 'cash', 'bank', 'finance' },

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
