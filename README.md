# PF2e Monster Import

A perpetually unreleased module to import monsters from https://monster.pf2.tools/

## Why are you not releasing this?

This module cannot ever become complete, and minor input errors may cause failures. There are also some aspects that are hard to automated. Therefore using this module comes with the caveat that you will have to make some adjustments. Due to system dev work on the PF2e system, I cannot handle the incredible amount of support such a module requires. A certain base level of troubleshooting willingness is required, and thus the installation of the module is a bit harder to weed out people who are not willing to put in that time.

## How to build

This project is a typescript project, and builds like the system does. Copy the foundryconfig.example.json to foundryconfig.json, tweak its properties, then `npm ci` to set up dependencies followed by either `npm run build:dev` for development or `npm run build` for production.
