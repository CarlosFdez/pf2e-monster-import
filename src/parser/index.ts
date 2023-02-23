import { tupleHasValue, objectHasKey } from "../util";

import { SpellParser } from "./spells";
import { sluggify } from "../util";
import { MonsterData, MonsterParseResults, SpecialType } from "./types";
import { ALIGNMENTS, SKILLS } from "./values";
import { Rarity, Size } from "@module/data";
import { NPCData } from "@actor/data";
import { NPCPF2e } from "@actor";
import { ActionItemSource, ItemSourcePF2e, LoreSource } from "@item/data";
import { NPCSystemData } from "@actor/npc/data";
import { CreatureTrait, CreatureTraitsSource, LabeledSpeed } from "@actor/creature/data";
import { MeleeDamageRoll, MeleeSource } from "@item/melee/data";
import { parseDescription } from "./text";
import { ImmunityData, ResistanceData, WeaknessData } from "@actor/data/iwr";

type Language = keyof typeof CONFIG.PF2E.languages;

const SizesMap: Record<string, Size> = {
    tiny: "tiny",
    small: "sm",
    medium: "med",
    large: "lg",
    gargantuam: "grg",
};
const ActionCategoryMap: Record<SpecialType, keyof ConfigPF2e["PF2E"]["actionCategories"]> = {
    offense: "offensive",
    defense: "defensive",
    general: "interaction",
};

function createEmptyData(): DeepPartial<NPCData> {
    return {
        system: {
            attributes: {},
            details: {},
            traits: {},
        },
    };
}

/** A mapping of lowercase values to the key for the damage type */
function createDamageReverseMap() {
    const result: Record<string, keyof ConfigPF2e["PF2E"]["damageTypes"]> = {};
    for (const [key, value] of Object.entries(CONFIG.PF2E.damageTypes)) {
        result[game.i18n.localize(value).toLowerCase()] = key as keyof ConfigPF2e["PF2E"]["damageTypes"];
    }
    return result;
}

export class MonsterParser {
    reverseDamageTypes = createDamageReverseMap();

    async parse(input: string, _actor: NPCPF2e): Promise<MonsterParseResults> {
        const data: MonsterData = JSON.parse(input);

        const updates = createEmptyData();
        const alignment = data.alignment.toUpperCase();

        mergeObject(updates, {
            name: data.name,
            system: {
                abilities: this.readAbilities(data),
                attributes: this.readAttributes(data),
                details: {
                    level: { value: data.level },
                    alignment: {
                        value: tupleHasValue(ALIGNMENTS, alignment) ? alignment : "N",
                    },
                    publicNotes: data.description,
                },
                traits: this.readTraits(data),
                saves: {
                    fortitude: { value: Number(data.fortitude.value) },
                    reflex: { value: Number(data.reflex.value) },
                    will: { value: Number(data.will.value) },
                },
            },
        });

        const items: DeepPartial<ItemSourcePF2e>[] = [];
        items.push(...(data.strikes ?? []).map(this.readStrike.bind(this)));
        for (const actionData of data.specials ?? []) {
            items.push(this.readAction(actionData));
        }
        items.push(...this.readSkill(data));

        const spellParser = new SpellParser();
        const parsedSpells = await spellParser.readSpellcastingEntry(data);

        return { updates, items, parsedSpells };
    }

    private readAbilities(data: MonsterData) {
        function score(modStr: string | number) {
            return { mod: Number(modStr) };
        }

        return {
            str: score(data.strength.value),
            dex: score(data.dexterity.value),
            con: score(data.constitution.value),
            int: score(data.intelligence.value),
            wis: score(data.wisdom.value),
            cha: score(data.charisma.value),
        };
    }

    private readAttributes(data: MonsterData): DeepPartial<NPCSystemData["attributes"]> {
        const speeds = String(data.speed).split(",");

        const otherSpeeds: Partial<LabeledSpeed>[] = [];
        const formattedSpeeds: DeepPartial<NPCSystemData["attributes"]["speed"]> = {
            value: 0,
            otherSpeeds,
            details: "",
        };

        for (const speed of speeds.map((s) => s.replace("feet", "").trim())) {
            const splitSpeed = speed.split(";");
            const value = Number(splitSpeed[0]?.match(/[0-9]+/g)?.[0]) ?? 0;

            // If there's no type, then it's walking speed.
            const type = splitSpeed[0].match(/[A-Za-z]+/g)?.[0];
            if (type && objectHasKey(CONFIG.PF2E.speedTypes, type)) {
                otherSpeeds.push({ type, value });
            } else {
                formattedSpeeds.value = value;
                formattedSpeeds.details = splitSpeed[1] ?? "walking";
            }
        }

        const immunities = this.readImmunities(data);
        const weaknesses = this.readWeaknesses(data);
        const resistances = this.readResistances(data);

        return {
            ac: { value: Number(data.ac.value) },
            perception: { value: Number(data.perception.value) },
            hp: { value: Number(data.hp.value), max: Number(data.hp.value) },
            allSaves: { value: data.savenote },
            speed: formattedSpeeds,
            immunities,
            weaknesses,
            resistances,
        };
    }

    private readTraits(data: MonsterData): DeepPartial<CreatureTraitsSource> {
        const traits = [data.type, ...data.traits.split(",")].map((trait) => trait.toLowerCase().trim());

        const rarity = traits.find((trait) => objectHasKey(CONFIG.PF2E.rarityTraits, trait));
        const languages = (data.languages?.split(",") ?? []).filter((language): language is Language =>
            objectHasKey(CONFIG.PF2E.languages, language)
        );

        return {
            size: { value: SizesMap[data.size] ?? "med" },
            rarity: (rarity ?? "common") as Rarity,
            languages: { value: languages },
            value: traits.filter((trait): trait is CreatureTrait => objectHasKey(CONFIG.PF2E.creatureTraits, trait)),
        };
    }

    private readImmunities(data: MonsterData): Partial<ImmunityData>[] {
        const immunities = data.immunity.value.split(",");

        const formattedImmunity: Partial<ImmunityData>[] = [];
        for (const immunity of immunities) {
            // extract string from weakness
            const type = immunity
                .match(/[A-Za-z]+/g)
                ?.join("-")
                .toLowerCase();
            if (objectHasKey(CONFIG.PF2E.immunityTypes, type)) {
                formattedImmunity.push({ type });
            }
        }
        return formattedImmunity;
    }

    private readWeaknesses(data: MonsterData): Partial<WeaknessData>[] {
        const weaknesses = data.weakness.value.split(",");

        const formattedWeaknesses: Partial<WeaknessData>[] = [];
        for (const weakness of weaknesses) {
            // extract number value from weakness
            const value = Number(weakness.match(/[0-9]+/g)?.[0]);

            // extract string from weakness
            const type = sluggify(weakness.match(/[A-Za-z]+/g)?.[0] ?? "");
            if (objectHasKey(CONFIG.PF2E.weaknessTypes, type)) {
                formattedWeaknesses.push({ type, value });
            }
        }

        return formattedWeaknesses;
    }

    private readResistances(data: MonsterData): Partial<ResistanceData>[] {
        const resistances = data.resistance.value.split("");

        const splitArray: string[] = [];
        let element: string[] = [];
        let openBracket = false;

        // todo: clean up
        for (let i = 0; i <= resistances.length; i++) {
            const char = resistances[i];

            if (openBracket === false) {
                if (char === ",") {
                    if (element.length) {
                        splitArray.push(element.join(""));
                        element = [];
                    }
                } else if (char === "(") {
                    openBracket = true;
                    element.push(char);
                } else {
                    element.push(char);
                }
            } else {
                if (char === ")") {
                    element.push(char);
                    splitArray.push(element.join(""));
                    openBracket = false;
                    element = [];
                } else {
                    element.push(char);
                }
            }
        }

        const formattedResistances: Partial<ResistanceData>[] = [];
        for (let item of splitArray) {
            item = item.replace("or", "").trim();

            const typeSlug = sluggify(item.split("(")[0]?.match(/[A-Za-z]+/g)?.[0] ?? "");
            const type = typeSlug === "all-damage" ? "all" : typeSlug;
            if (objectHasKey(CONFIG.PF2E.resistanceTypes, type)) {
                formattedResistances.push({
                    type,
                    value: Number(item.match(/[0-9]+/g)?.[0]),
                    // exceptions: item.match(/(?<=\().*(?=\))/g)?.[0],
                });
            }
        }

        return formattedResistances;
    }

    private readAction(data: MonsterData["specials"][number]): DeepPartial<ActionItemSource> {
        const actionCostMap: Record<string, 1 | 2 | 3 | undefined> = {
            one: 1,
            two: 2,
            three: 3,
        };

        const actionTypeMap = {
            none: "passive",
            free: "free",
            reaction: "reaction",
        } as const;

        // Check if a glossary entry exists. Failed lookups match the key, so we need to test for that case
        const glossaryLookupKey = `PF2E.NPC.Abilities.Glossary.${sluggify(data.name, { camel: "bactrian" })}`;
        const glossaryLookup = game.i18n.localize(glossaryLookupKey);
        const glossaryInfo = glossaryLookup === glossaryLookupKey ? null : glossaryLookup;

        // Parse the description, keeping in mind alterations due to special actions
        const baseDescription = (() => {
            if (["Constrict", "Greater Constrict"].includes(data.name)) {
                return parseDescription(data.description.replace("DC", "damage, DC") + " fortitude");
            }

            return parseDescription(data.description);
        })();

        const description = glossaryInfo ? `${baseDescription}<hr />${glossaryInfo}` : baseDescription;

        const actionCost = ((): Partial<ActionItemSource["system"]> => {
            if (data.actions in actionCostMap) {
                return {
                    actionType: { value: "action" },
                    actions: { value: actionCostMap[data.actions] ?? null },
                };
            }

            if (objectHasKey(actionTypeMap, data.actions)) {
                return { actionType: { value: actionTypeMap[data.actions] } };
            }

            return { actionType: { value: "passive" } };
        })();

        return {
            name: data.name,
            type: "action",
            system: {
                ...actionCost,
                actionCategory: { value: ActionCategoryMap[data.type] },
                description: { value: description },
            },
        };
    }

    private readStrike(data: MonsterData["strikes"][number]): DeepPartial<MeleeSource> {
        const type = data.type?.toLowerCase() ?? "melee";
        const damageRolls: Record<string, MeleeDamageRoll> = {};
        const attackEffects: string[] = [];
        const rollStrings = data.damage.split(" plus ");
        for (const rollString of rollStrings) {
            const match = rollString?.trim().match(/(\d+?d\d+[+-]?\d*)+(.*)?/);

            if (match) {
                const damage = match ? match[1] : rollString;
                const damageType = (() => {
                    if (match && match[2]) {
                        const parts = match[2].split(" ").map((part) => part.toLowerCase());
                        for (const part of parts) {
                            if (part in this.reverseDamageTypes) {
                                return this.reverseDamageTypes[part];
                            }
                        }
                    }

                    return "untyped";
                })();

                damageRolls[randomID()] = { damage, damageType };
            } else {
                // It might be something like knockdown
                const slug = sluggify(rollString.toLowerCase());
                if (objectHasKey(CONFIG.PF2E.attackEffects, slug)) {
                    attackEffects.push(slug);
                }
            }
        }

        type Trait = keyof ConfigPF2e["PF2E"]["npcAttackTraits"];
        const traits = (data.traits ?? "")
            .split(",")
            .map((s) => sluggify(s.trim()))
            .filter((t): t is Trait => t in CONFIG.PF2E.npcAttackTraits);

        return {
            name: data.name,
            type: "melee",
            system: {
                bonus: { value: Number(data.attack) || 0 },
                weaponType: { value: type === "melee" ? "melee" : "ranged" },
                damageRolls,
                attackEffects: { value: attackEffects },
                traits: {
                    value: traits,
                },
            },
        };
    }

    private readSkill(data: MonsterData): DeepPartial<LoreSource>[] {
        const skillsList: DeepPartial<LoreSource>[] = [];

        for (const [key, value] of Object.entries(data)) {
            const capitalizedSkill = key.charAt(0).toUpperCase() + key.slice(1);
            if (tupleHasValue(SKILLS, capitalizedSkill)) {
                if (value.value) {
                    skillsList.push({
                        _id: randomID(),
                        type: "lore",
                        name: capitalizedSkill,
                        system: {
                            mod: {
                                value: Number(value.value),
                            },
                            proficient: {
                                value: 0,
                            },
                        },
                    });
                }
            }
        }

        return skillsList;
    }
}
