import { capitalizeWords, objectHasKey } from "../util";
import {
    MagicTradition,
    PreparationType,
    SpellcastingEntrySource,
    SpellSlotData,
} from "@pf2e/module/item/spellcasting-entry/data";
import { SpellSource } from "@pf2e/module/item/data";
import { SpellPF2e } from "@pf2e/module/item";
import { MonsterData, MonsterSpellStats } from "./types";

interface SpellMetadata {
    id: string;
    compendiumID: string;
    name: string;
    preparedNumber: number;
    spellData: SpellSource;
}

function isSpell(document: unknown): document is SpellPF2e {
    return document instanceof Item && document?.type === "spell";
}

export class SpellParser {
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
            spellGroups.push(...(await this.parseTradition(data.spelltype, data)));
        }

        // check for additional casting types
        if (data.morespells && data.morespells.length) {
            for (const moreTradition of data.morespells) {
                spellGroups.push(...(await this.parseTradition(moreTradition.name, moreTradition)));
            }
        }

        return spellGroups;
    }

    private async parseTradition(name: string, data: MonsterSpellStats) {
        const cha = "cha";
        const traditionId = randomID();
        const spellType = name.split(" ");

        const traditionName = this.parseTraditionName(spellType[0]);
        const preparedType = this.parsePreparationType(spellType[1]);

        const parsedSpells = await this.parseSpells(data.spells, preparedType, traditionId);

        const spellCastingEntry: DeepPartial<SpellcastingEntrySource> = {
            _id: traditionId,
            name: capitalizeWords(`${traditionName} ${preparedType} Spells`),
            type: "spellcastingEntry",
            data: {
                ability: {
                    value: cha,
                },
                spelldc: {
                    value: data.spelldc.value ? Number(data.spelldc.value) : 0,
                    dc: data.spelldc.value ? Number(data.spelldc.value) : 0,
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
            },
        };

        spellCastingEntry.data.slots = (() => {
            const preparedType = spellCastingEntry.data?.prepared?.value;

            const slots: Record<`slot${number}`, SpellSlotData> = {};
            for (let i = 0; i <= 11; i++) {
                slots[`slot${i}`] = {
                    prepared: [],
                    value: 0,
                    max: 0,
                };

                if (preparedType == "prepared") {
                    if (parsedSpells[i] && parsedSpells[i].length) {
                        for (const spell of parsedSpells[i]) {
                            for (let j = spell.preparedNumber; j > 0; j--) {
                                slots[`slot${i}`].prepared.push(spell.id);
                                slots[`slot${i}`].value += 1;
                                slots[`slot${i}`].max += 1;
                            }
                        }
                    }
                }
            }
        })();

        const flatSpells = parsedSpells.flat().map((item) => item.spellData);

        return [spellCastingEntry, ...flatSpells];
    }

    private async parseSpells(
        spellLevels: string[],
        preparedType: string,
        traditionId: string,
    ): Promise<Array<Array<SpellMetadata>>> {
        const compendium = await this.getCompendium();
        if (!compendium) {
            ui.notifications.error("Failed to load spell compendium to import spells");
            return [];
        }

        const spellCompendium = await compendium.getIndex();

        spellLevels = spellLevels.reverse();

        const spellList = [];

        for (let level = 0; level <= spellLevels.length; level++) {
            const levelSpellList = spellLevels[level];

            const parsedLevelSpells: SpellMetadata[] = [];

            if (levelSpellList && levelSpellList.length) {
                const levelSpellListArray = levelSpellList.split(",");

                for (const item of levelSpellListArray) {
                    const htmlTags = /(<([^>]+)>)/gi;
                    const spell = item.trim().replaceAll(htmlTags, "");

                    // find number of times prepared, if any
                    const numberInParenthesis = /\([^\d]*(\d+)[^\d]*\)/;
                    const prepared = spell.match(numberInParenthesis) as string[] | string | null;

                    const preparedValue: number = prepared && prepared[1] ? parseInt(prepared[1]) : 1;

                    // find spellId in compendium
                    const indexData = spellCompendium.find((item) => item.name.toLowerCase() === spell.toLowerCase());

                    if (indexData) {
                        const spellEntry = await compendium.getDocument(indexData._id);
                        const spellID = randomID();
                        if (isSpell(spellEntry)) {
                            const spellData = spellEntry.toObject();

                            if (level > 0 && preparedType !== "prepared" && spellData.data) {
                                spellData.data["heightenedLevel"] = { value: level };
                            }

                            spellData["_id"] = spellID;
                            spellData.data.location = { value: traditionId };

                            parsedLevelSpells.push({
                                id: spellID,
                                compendiumID: indexData._id,
                                name: spellEntry.name,
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

    private parseTraditionName(tradition: string): MagicTradition {
        if (!tradition) return "arcane";
        tradition = tradition.toLowerCase().trim();

        if (objectHasKey(this.spellTraditions, tradition)) {
            return tradition;
        } else {
            return "arcane";
        }
    }

    private parsePreparationType(preparation: string): PreparationType {
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
