lib.locale()

CreateThread(function()
    local ok = pcall(function()
        MySQL.query.await([[CREATE TABLE IF NOT EXISTS `whereiaml_vehicleshop_finance` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `citizenid` VARCHAR(64) NOT NULL,
            `vehicleid` VARCHAR(64) NOT NULL,
            `balance` INT NOT NULL,
            `payment_amount` INT NOT NULL,
            `payments_left` INT NOT NULL,
            `missed` INT NOT NULL DEFAULT 0,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_citizenid` (`citizenid`),
            KEY `idx_vehicleid` (`vehicleid`)
        )]])
    end)
    if not ok and Config.Debug then
        lib.print.error('failed creating finance table')
    end
end)

lib.callback.register('whereiaml_vehicleshop:getData', function()
    local f = Config.Server.finance
    return {
        catalog = Catalog.get(),
        payments = Config.Server.paymentMethods,
        finance = {
            enabled = f.enabled,
            downPercent = f.minDownPercent,
            interestPercent = f.interestPercent,
            maxPayments = f.maxPayments,
        },
    }
end)

local STUDIO_BUCKET_BASE <const> = 6000

lib.callback.register('whereiaml_vehicleshop:enterStudio', function(source)
    SetPlayerRoutingBucket(source, STUDIO_BUCKET_BASE + source)
    return true
end)

RegisterNetEvent('whereiaml_vehicleshop:exitStudio', function()
    SetPlayerRoutingBucket(source, 0)
end)

AddEventHandler('playerDropped', function()
    SetPlayerRoutingBucket(source, 0)
end)
