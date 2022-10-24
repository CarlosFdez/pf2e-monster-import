import { NPCPF2e } from "@pf2e/module/actor";
import { NPCData } from "@pf2e/module/actor/data";
import { Rarity, Size } from "@pf2e/module/data";

import { tupleHasValue, objectHasKey } from "../util";

import { ActionSource, ItemSourcePF2e, LoreSource, MeleeSource } from "@pf2e/module/item/data";
import { MeleeDamageRoll } from "@pf2e/module/item/melee/data";
import { SpellParser } from "./spells";
import { sluggify } from "../util";
import { MonsterData, MonsterParseResults, SpecialType } from "./types";
import { ALIGNMENTS, SKILLS } from "./values";
import { NPCSystemData } from "@pf2e/module/actor/npc/data";
import { CreatureSpeeds, CreatureTrait } from "@pf2e/module/actor/creature/data";
import { ImmunityType, LabeledResistance, LabeledWeakness } from "@pf2e/module/actor/data/base";

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
        data: {
            attributes: {},
            details: {},
            traits: {},
        },
    };
}

/** A mapping of lowercase values to the key for the damage type */
function createDamageReverseMap() {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(CONFIG.PF2E.damageTypes)) {
        result[game.i18n.localize(value).toLowerCase()] = key;
    }
    return result;
}

export class MonsterParser {
    reverseDamageTypes = createDamageReverseMap();

    async parse(input: string, actor: NPCPF2e): Promise<MonsterParseResults> {
        const data: MonsterData = JSON.parse(input);

        const updates = createEmptyData();
        const alignment = data.alignment.toUpperCase();

        mergeObject(updates, {
            name: data.name,
            data: {
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
        items.push(...(data.specials ?? []).map(this.readAction.bind(this)));
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

        const otherSpeeds: Partial<CreatureSpeeds>[] = [];
        const formattedSpeeds: DeepPartial<NPCSystemData["attributes"]["speed"]> = {
            value: "",
            details: "",
            otherSpeeds,
        };

        for (const speed of speeds.map((s) => s.replace("feet", "").trim())) {
            const splitSpeed = speed.split(";");
            const value = String(splitSpeed[0]?.match(/[0-9]+/g)?.[0]) ?? "";

            // If there's no type, then it's walking speed.
            const type = splitSpeed[0].match(/[A-Za-z]+/g)?.[0];
            if (type && objectHasKey(CONFIG.PF2E.speedTypes, type)) {
                otherSpeeds.push({ type, value });
            } else {
                formattedSpeeds.value = String(value);
                formattedSpeeds.details = splitSpeed[1] ?? "walking";
            }
        }

        return {
            ac: { value: Number(data.ac.value) },
            perception: { value: Number(data.perception.value) },
            hp: { value: Number(data.hp.value), max: Number(data.hp.value) },
            allSaves: { value: data.savenote },
            speed: formattedSpeeds,
        };
    }

    private readTraits(data: MonsterData): DeepPartial<NPCData["data"]["traits"]> {
        const traits = [data.type, ...data.traits.split(",")].map((trait) => trait.toLowerCase().trim());

        const rarity = traits.find((trait) => objectHasKey(CONFIG.PF2E.rarityTraits, trait));
        const languages = (data.languages?.split(",") ?? []).filter((language): language is Language =>
            objectHasKey(CONFIG.PF2E.languages, language),
        );
        const weaknesses = this.readWeaknesses(data);
        const resistances = this.readResistances(data);
        const immunities = this.readImmunities(data);

        return {
            size: { value: SizesMap[data.size] ?? "med" },
            rarity: (rarity ?? "common") as Rarity,
            languages: { value: languages },
            value: traits.filter((trait): trait is CreatureTrait => objectHasKey(CONFIG.PF2E.creatureTraits, trait)),
            dv: weaknesses,
            dr: resistances,
            di: { value: immunities },
        };
    }

    private readWeaknesses(data: MonsterData): Partial<LabeledWeakness>[] {
        const weaknesses = data.weakness.value.split(",");

        const formattedWeaknesses: Partial<LabeledWeakness>[] = [];
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

    private readResistances(data: MonsterData): Partial<LabeledResistance>[] {
        const resistances = data.resistance.value.split("");

        const splitArray = [];
        let element = [];
        let openBracket = false;

        for (let i = 0; i <= resistances.length; i++) {
            const char = resistances[i];

            if (openBracket == false) {
                if (char == ",") {
                    if (element.length) {
                        splitArray.push(element.join(""));
                        element = [];
                    }
                } else if (char == "(") {
                    openBracket = true;
                    element.push(char);
                } else {
                    element.push(char);
                }
            } else {
                if (char == ")") {
                    element.push(char);
                    splitArray.push(element.join(""));
                    openBracket = false;
                    element = [];
                } else {
                    element.push(char);
                }
            }
        }

        const formattedResistances: Partial<LabeledResistance>[] = [];
        for (let item of splitArray) {
            item = item.replace("or", "").trim();

            const typeSlug = sluggify(item.split("(")[0]?.match(/[A-Za-z]+/g)?.[0] ?? "");
            const type = typeSlug === "all-damage" ? "all" : typeSlug;
            if (objectHasKey(CONFIG.PF2E.resistanceTypes, type)) {
                formattedResistances.push({
                    type,
                    value: Number(item.match(/[0-9]+/g)?.[0]),
                    exceptions: item.match(/(?<=\().*(?=\))/g)?.[0],
                });
            }
        }

        return formattedResistances;
    }

    private readImmunities(data: MonsterData): ImmunityType[] {
        const immunities = data.immunity.value.split(",");

        const formattedImmunity: ImmunityType[] = [];
        for (const immunity of immunities) {
            // extract string from weakness
            const type = immunity
                .match(/[A-Za-z]+/g)
                ?.join("-")
                .toLowerCase();
            if (objectHasKey(CONFIG.PF2E.immunityTypes, type)) {
                formattedImmunity.push(type);
            }
        }
        return formattedImmunity;
    }

    private readAction(data: MonsterData["specials"][number]): DeepPartial<ActionSource> {
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

        const actionCost = ((): Partial<ActionSource["data"]> => {
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
            data: {
                ...actionCost,
                actionCategory: { value: ActionCategoryMap[data.type] },
                description: { value: parseDescription(data.description) },
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

        return {
            name: data.name,
            type: "melee",
            data: {
                bonus: { value: Number(data.attack) || 0 },
                weaponType: { value: type === "melee" ? "melee" : "ranged" },
                damageRolls,
                attackEffects: { value: attackEffects },
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
                        data: {
                            mod: {
                                value: value.value,
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

const CONDITION_COMPENDIUM = "@Compendium[pf2e.conditionitems.";

function parseDescription(text: string) {
    let string =
        "<p>" +
        text
            .replaceAll("’", "'")
            .replaceAll("Trigger", "<p><strong>Trigger</strong>")
            .replaceAll("Requirements", "<p><strong>Requirements</strong>")
            .replaceAll("\nCritical Success", "</p><hr /><p><strong>Critical Success</strong>")
            .replaceAll("\nSuccess", "</p><p><strong>Success</strong>")
            .replaceAll("\nFailure", "</p><p><strong>Failure</strong>")
            .replaceAll("\nCritical Failure", "</p><p><strong>Critical Failure</strong>")
            .replaceAll("\nSpecial", "</p><p><strong>Special</strong>")
            .replaceAll("\n", " ")
            .replaceAll("Frequency", "<p><strong>Frequency</strong>")
            .replaceAll("Effect", "</p><p><strong>Effect</strong>")
            .replaceAll("—", "-")
            .replaceAll("Cost", "<strong>Cost</strong>") +
        "</p>";
    string = string.replaceAll("<p><p>", "<p>").replaceAll("–", "-").replaceAll("”", '"').replaceAll("“", '"');

    string = string
        .replaceAll("Maximum Duration", "</p><p><strong>Maximum Duration</strong>")
        .replaceAll("Onset", "</p><p><strong>Onset</strong>")
        .replaceAll("Saving Throw", "</p><p><strong>Saving Throw</strong>");
    string = string.replace(/Stage (\d)/, "</p><p><strong>Stage $1</strong>");

    string = string.replaceAll(" </p>", "</p>");

    string = string.replace(/Activate \?/, "</p><p><strong>Activate</strong> <span class='pf2-icon'>1</span>");

    // // Skills and saves
    string = string.replace(/DC (\d+) basic (\w+) save/, "@Check[type:$2|dc:$1|basic:true]");
    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/(Reflex|Will|Fortitude) DC (\d+)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) save \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");

    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/(\w+) DC (\d+)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");

    string = string.replace(/(\w+) Lore DC (\d+)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/DC (\d+) (\w+) save/, "@Check[type:$2|dc:$1]");
    string = string.replace(/DC (\d+) flat check/, "@Check[type:flat|dc:$1]");

    // Catch capitalized saves and skills
    string = string.replace(/@Check\[type:(\w+)\|/, (_, match) => `@Check[type:${match.toLowerCase()}|`);

    // Damage rolls
    string = string.replace(/ (\d)d(\d) (rounds|minutes|hours|days)/, " [[/r $1d$2 #$3]]{$1d$2 $3}");
    string = string.replace(/ (\d+) (\w*) damage/, " [[/r {$1}[$2]]]{$1 $2 Damage}");
    string = string.replace(/(\d+)d(\d+)\+(\d+) (\w*) damage/, "[[/r {$1d$2 + $3}[$4]]]{$1d$2 + $3 $4 damage}");
    string = string.replace(
        /(\d+)d(\d+) persistent (\w*) damage/,
        `[[/r {$1d$2}[persistent,$3]]]{$1d$2} ${CONDITION_COMPENDIUM}Persistent Damage]{Persistent $3 Damage}`,
    );
    string = string.replace(/(\d+)d(\d+) (\w*) damage/, "[[/r {$1d$2}[$3]]]{$1d$2 $3 damage}");
    string = string.replace(/(\d+)d(\d+) (\w+)(,|\.)/, "[[/r $1d$2 #$3]]{$1d$2 $3}$4");
    string = string.replace(/(\d+)d(\d+)\./, "[[/r $1d$2]]{$1d$2}.");

    // Spell heightening handling
    string = string.replace("Heightened (", "<hr />Heightened (");
    string = string.replace(/Heightened \(\+(\d+)\)/, "</p><p><strong>Heightened (+$1)</strong>");
    string = string.replace(/Heightened \((\d+)(\w+)\)/, "</p><p><strong>Heightened ($1$2)</strong>");
    string = string.replaceAll("<hr/></p><p><strong>Heightened", "</p><hr/><p><strong>Heightened");

    // Removing bullet points, should replace with the actual bullet points.
    string = string.replace("•", "<ul><li>");
    string = string.replaceAll("•", "</li><li>");

    // Add template buttons
    string = string.replace(/(\d+)-foot (emanation|burst|cone|line)/, "@Template[type:$2|distance:$1]");

    // string = handle_actions(string)
    // string = handle_conditions(string)
    // string = handle_equipment(string)
    // string = handle_feats(string)
    // string = handle_spells(string)
    // string = handle_activation_actions(string)

    return string;
}
