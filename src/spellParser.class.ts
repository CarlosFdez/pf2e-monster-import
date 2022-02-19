import { objectHasKey } from "./util";

import example from "./examples/example.json";
import malfunctioningRepairDrone from "./examples/malfunctioning-repair-drone.json";
import { MagicTradition, PreparationType, SpellSlotData, SpellSlots } from "@pf2e/module/item/spellcasting-entry/data";
import { SpellData, SpellSource } from "@pf2e/module/item/data";
import { SpellPF2e } from "@pf2e/module/item";

type SpecialType = "offense" | "general" | "defense";

interface MonsterDataGood {
    languages?: string;
    specials: {
        id: string;
        name: string;
        traits: string;
        actions: string;
        type: SpecialType;
        description: string;
    }[];
}

type MonsterDataExample = typeof malfunctioningRepairDrone & typeof example;

type MonsterData = MonsterDataGood & Omit<MonsterDataExample, keyof MonsterDataGood>;

interface Focus {
    max: number;
    value: number;
}

interface Spell {
    spellID: string;
    compendiumID: string;
    name: string;
    preparedNumber: number;
    spellData: SpellSource;
}

function isSpell(document: unknown): document is SpellPF2e {
    return document instanceof Item && document?.type === "spell";
}

function capitalizeWords(string): string {
    // remove anything in paranthesis
    string = string.replace(/\([^()]+\)/g, "");

    return string
        .split(" ")
        .map((word) => {
            // capitalize name
            word = word.toLowerCase();
            word = word.charAt(0).toUpperCase() + word.slice(1);

            return word;
        })
        .join(" ")
        .trim();
}

export class SpellParser {
    traditionItems: Array<any>;
    spellItems: Array<SpellData>;

    focus: Focus = {
        max: 0,
        value: 0,
    };

    // let spellTraditions = CONFIG['PF2E']['spellTraditions']
    spellTraditions = {
        arcane: "arcane",
        divine: "divine",
        occult: "occult",
        primal: "primal",
    };

    public async readSpellcastingEntry(data: MonsterData) {
        // collect all spell traditions from monster data
        const spellGroups = [];

        // read the main spell tradition, if exists
        if (data.spelltype) {
            spellGroups.push(...(await this.parseTradition(data)));
        }

        // check for additional casting types
        if (data.morespells && data.morespells.length) {
            for (const moreTradition of data.morespells) {
                spellGroups.push(...(await this.parseTradition(moreTradition)));
            }
        }

        return spellGroups;
    }

    private async parseTradition(data): Promise<any> {
        const cha = "cha";

        let name = "";
        if (data.spelltype) {
            name = data.spelltype;
        } else {
            name = data.name;
        }

        const traditionId = randomID();
        const spellType = name.split(" ");

        const traditionName = this.parseTraditionName(spellType[0]);
        const preparedType = this.parsePreparationType(spellType[1]);

        const parsedSpells = await this.parseSpells(data.spells, preparedType, traditionId);

        const spellCastingEntry = {
            _id: traditionId,
            name: capitalizeWords(`${traditionName} ${preparedType} Spells`),
            type: "spellcastingEntry",
            data: {
                ability: {
                    value: cha,
                },
                spelldc: {
                    value: parseInt(data.spelldc.value ? data.spelldc.value : "0"),
                    dc: parseInt(data.spelldc.value ? data.spelldc.value : "0"),
                    mod: 0,
                },
                tradition: {
                    value: traditionName as MagicTradition,
                },
                focus: {
                    points: data.focuspoints,
                    pool: data.focuspoints,
                },
                prepared: {
                    value: preparedType as PreparationType,
                },
                showUnpreparedSpells: {
                    value: true,
                },
                proficiency: {
                    value: 0,
                },
                displayLevels: [],
                slots: {},
                signatureSpells: {
                    value: [],
                },
            },
        };

        spellCastingEntry.data.slots = this.createSpellSlots(spellCastingEntry, parsedSpells);
        const flatSpells = parsedSpells.flat().map((item) => item.spellData);

        return [spellCastingEntry, ...flatSpells];
    }

    private createSpellSlots(spellCastingEntry, parsedSpells: Array<Array<Spell>>): SpellSlots {
        const preparedType = spellCastingEntry.data.prepared.value;

        const slots = {};

        for (let i = 0; i <= 11; i++) {
            slots[`slot${i}`] = {
                prepared: [],
                value: 0,
                max: 0,
            } as SpellSlotData;

            if (preparedType == "prepared") {
                if (parsedSpells[i] && parsedSpells[i].length) {
                    for (const spell of parsedSpells[i]) {
                        for (let j = spell.preparedNumber; j > 0; j--) {
                            slots[`slot${i}`].prepared.push(spell.spellID);
                            slots[`slot${i}`].value++;
                            slots[`slot${i}`].max++;
                        }
                    }
                }
            }
        }

        return slots as SpellSlots;
    }

    private async parseSpells(spellLevels, preparedType, traditionId): Promise<Array<Array<Spell>>> {
        const compendium = await this.getCompendium();
        const spellCompendium = (await compendium.getIndex()).contents;

        spellLevels = spellLevels.reverse();

        const spellList = [];

        for (let level = 0; level <= spellLevels.length; level++) {
            const levelSpellList = spellLevels[level];

            const parsedLevelSpells = [];

            if (levelSpellList && levelSpellList.length) {
                const levelSpellListArray = levelSpellList.split(",");

                for (const item of levelSpellListArray) {
                    const htmlTags = /(<([^>]+)>)/gi;
                    const spell = item.trim().replaceAll(htmlTags, "");

                    // find number of times prepared, if any
                    const numberInParenthesis = /\([^\d]*(\d+)[^\d]*\)/;
                    const prepared = spell.match(numberInParenthesis) as string[] | string | null;

                    const preparedValue: number = prepared && prepared[1] ? parseInt(prepared[1]) : 1;

                    const spellName = capitalizeWords(spell);

                    // find spellId in compendium
                    const id = spellCompendium.find((item) => {
                        if (item.name.toLowerCase() === spellName.toLowerCase()) {
                            return item;
                        } else {
                            return "";
                        }
                    });

                    if (id) {
                        const spellEntry = await compendium.getDocument(id._id);

                        let spellData;
                        const spellID = randomID();
                        if (isSpell(spellEntry)) {
                            spellData = Object.assign({}, spellEntry.data);

                            if (level > 0 && preparedType !== "prepared" && spellData.data) {
                                spellData.data["heightenedLevel"] = { value: level };
                            }

                            spellData["_id"] = spellID;
                            spellData.data.location = { value: traditionId };

                            parsedLevelSpells.push({
                                spellID: spellID,
                                compendiumID: id._id,
                                name: spellName,
                                preparedNumber: preparedValue,
                                spellData: spellData,
                            });
                        }
                    }
                }
            }

            spellList.push(parsedLevelSpells);
        }

        return spellList;
    }

    private parseTraditionName(tradition): MagicTradition {
        if (!tradition) return "arcane";
        tradition = tradition.toLowerCase().trim();

        if (objectHasKey(this.spellTraditions, tradition)) {
            return tradition;
        } else {
            return "arcane";
        }
    }

    private parsePreparationType(preparation): PreparationType {
        if (!preparation) return "innate";
        preparation = preparation.toLowerCase().trim();

        if (objectHasKey(CONFIG.PF2E.preparationType, preparation)) {
            return preparation;
        } else {
            return "innate";
        }
    }

    private async getCompendium() {
        return game.packs.get("pf2e.spells-srd");
    }

    public addLocationId(items, spellGroups) {
        console.warn(
            "ITEMS",
            items.map((item) => item.data),
        );
        console.warn("spellGroups", spellGroups);

        const spells = [];
        for (const group of spellGroups) {
            const spellEntryID = items.find((item) => item.data.name == group.traditionName).data.id;

            spells.push(
                ...group.spells.map((spell) => {
                    spell.data.location.value = spellEntryID;
                    return spell;
                }),
            );
        }

        return spells;
    }
}
