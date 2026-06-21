# whereiaml_vehicleshop

A standalone vehicle dealership with a live 3D showroom, paint customization, test drives
and financing. Works on QBox and ESX through a single bridge file.

## 📚 Documentation

https://docs.whereiaml.com/docs/whereiaml_vehicleshop

## Requirements

- [ox_lib](https://github.com/overextended/ox_lib)
- [oxmysql](https://github.com/overextended/oxmysql)
- [ox_target](https://github.com/overextended/ox_target)
- QBox or ESX

## Features

- Live 3D showroom — the real vehicle spawns on a podium; drag to rotate, scroll to zoom.
- Per-player routing bucket, so shoppers never see each other.
- Custom RGB primary/secondary paint, a pearl layer (161 GTA colors) and gloss/metallic/pearl/matte finishes, saved to the purchased vehicle.
- Animated door open/close.
- Test drive on a configurable strip with an on-screen timer.
- Cash, bank or finance (down payment + scheduled installments via ox_lib cron).
- `/myloans` to view and pay off active loans.
- Catalog search, live cash/bank display, click sounds.
- React + Mantine UI, config-driven, localized (English and German).

## Installation

Download the latest [release](https://github.com/WhereiamL/whereiaml_vehicleshop/releases)
(pre-built), drop it into `resources`, and add to `server.cfg`:

```cfg
ensure whereiaml_vehicleshop
```

The finance table is created on first start.

## Building from source

The release is pre-built. To build the UI yourself:

```bash
cd web
pnpm install
pnpm build
```

## License

Free to use and modify on your own server. You may not sell, resell or redistribute it,
original or modified. See [LICENSE](LICENSE). Made by WhereiamL.
