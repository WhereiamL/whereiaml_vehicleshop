CREATE TABLE IF NOT EXISTS `whereiaml_vehicleshop_finance` (
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
);
