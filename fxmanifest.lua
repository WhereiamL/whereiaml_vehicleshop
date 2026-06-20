fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'WhereiamL'
description 'Premium standalone vehicle dealership (QBox + ESX) with live showroom, color, doors, test drive and finance'
version '1.0.0'
repository 'https://github.com/whereiaml/whereiaml_vehicleshop'

shared_scripts {
    '@ox_lib/init.lua',
    'config/shared.lua',
}

client_scripts {
    'config/client.lua',
    'bridge/framework.lua',
    'client/nui.lua',
    'client/showroom.lua',
    'client/testdrive.lua',
    'client/main.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'config/server.lua',
    'bridge/framework.lua',
    'server/finance.lua',
    'server/purchase.lua',
    'server/main.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/assets/*.js',
    'web/build/assets/*.css',
    'web/images/*.png',
    'locales/*.json',
}

dependencies {
    'ox_lib',
    'oxmysql',
    'ox_target',
}
