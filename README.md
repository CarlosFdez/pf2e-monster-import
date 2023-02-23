# PF2e Monster Import

A perpetually unreleased module to import monsters from https://monster.pf2.tools/

## Why are you not releasing this?

A module of this nature cannot ever be 100%, and due to my system dev work on the PF2e system, I cannot be expected to update every single issue in a timely manor. Imported NPCs may sometimes need to be adjusted, and a bit of willingness to get down and dirty and is expected of you, and thus the installation of the module is a bit harder to weed out people who are not willing to put in that time.

If you can figure out how to grab the module.json from the releases page, you can use this module, basically.

## How to build

This project is a typescript project, and builds like the system does. Copy the foundryconfig.example.json to foundryconfig.json, tweak its properties, then `npm ci` to set up dependencies followed by either `npm run build:dev` for development or `npm run build` for production.
