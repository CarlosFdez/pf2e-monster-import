import { SpellPF2e } from "@item";
import { ItemSourcePF2e, SpellSource } from "@item/data";
import { MagicTradition } from "@item/spell/types";
import {
    PreparationType,
    SlotKey,
    SpellcastingEntrySource,
    SpellcastingEntrySystemData,
} from "@item/spellcasting-entry/data";
import { OneToTen } from "@module/data";
import { capitalizeWords, objectHasKey } from "../util";
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

    public async readSpellcastingEntry(data: MonsterData): Promise<DeepPartial<ItemSourcePF2e>[]> {
        // collect all spell traditions from monster data
        const spellGroups: DeepPartial<ItemSourcePF2e>[] = [];

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

    private async parseTradition(name: string, data: MonsterSpellStats): Promise<DeepPartial<ItemSourcePF2e>[]> {
        const cha = "cha";
        const traditionId = randomID();
        const spellType = name.split(" ");

        const traditionName = this.parseTraditionName(spellType[0]);
        const preparedType = this.parsePreparationType(spellType[1]);

        const parsedSpells = await this.parseSpells(data.spells, preparedType, traditionId);

        // const focus = { value: data.focuspoints, max: data.focuspoints };

        const slots = (() => {
            const slots: Partial<SpellcastingEntrySystemData["slots"]> = {};
            for (let i = 0; i <= 10; i++) {
                const slotKey = `slot${i as OneToTen}` as SlotKey;
                if (preparedType !== "prepared" || !parsedSpells[i]) {
                    slots[slotKey] = { prepared: [], value: 0, max: 0 };
                    continue;
                }

                const prepared: { id: string }[] = [];
                for (const spell of parsedSpells[i]) {
                    for (let j = spell.preparedNumber; j > 0; j--) {
                        prepared.push({ id: spell.id });
                    }
                }

                const total = parsedSpells[i].reduce((total, current) => total + current.preparedNumber, 0);
                slots[slotKey] = { prepared: { ...prepared }, value: total, max: total };
            }

            return slots;
        })();

        const spellCastingEntry: DeepPartial<SpellcastingEntrySource> = {
            _id: traditionId,
            name: capitalizeWords(`${traditionName} ${preparedType} Spells`),
            type: "spellcastingEntry",
            system: {
                ability: {
                    value: cha,
                },
                spelldc: {
                    value: data.spelldc.value ? Number(data.spelldc.value) : 0,
                    dc: data.spelldc.value ? Number(data.spelldc.value) : 0,
                },
                tradition: {
                    value: traditionName as MagicTradition,
                },
                prepared: {
                    value: preparedType as PreparationType,
                },
                proficiency: {
                    value: 1,
                },
                slots,
            },
        };

        const flatSpells = parsedSpells.flat().map((item) => item.spellData);

        return [spellCastingEntry, ...flatSpells];
    }

    private async parseSpells(
        spellLevels: string[],
        preparedType: string,
        traditionId: string
    ): Promise<SpellMetadata[][]> {
        const compendium = await this.getCompendium();
        if (!compendium) {
            ui.notifications.error("Failed to load spell compendium to import spells");
            return [];
        }

        const spellCompendium = await compendium.getIndex();

        spellLevels = spellLevels.reverse();

        const spellList: SpellMetadata[][] = [];

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

                            if (level > 0 && preparedType !== "prepared" && spellData.system) {
                                spellData.system.location.heightenedLevel = level;
                            }

                            spellData["_id"] = spellID;
                            spellData.system.location = { value: traditionId };

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
}
