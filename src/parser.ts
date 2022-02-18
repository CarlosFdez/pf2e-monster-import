import { NPCPF2e } from "@pf2e/module/actor";
import { Alignment } from "@pf2e/module/actor/creature/data";
import { NPCData } from "@pf2e/module/actor/data";
import { Rarity, Size } from "@pf2e/module/data";

import { tupleHasValue, objectHasKey } from "./util";

import example from "./examples/example.json";
import malfunctioningRepairDrone from "./examples/malfunctioning-repair-drone.json";
import { ActionSource, ItemSourcePF2e, LoreSource, MeleeSource } from "@pf2e/module/item/data";
import { MeleeDamageRoll } from "@pf2e/module/item/melee/data";
import { SpellParser } from "./spellParser.class";

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

type Language = keyof typeof CONFIG.PF2E.languages;

const Alignments: ReadonlyArray<Alignment> = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"] as const;
const SizesMap: Record<string, Size> = {
    "tiny": "tiny",
    "small": "sm",
    "medium": "med",
    "large": "lg",
    "gargantuam": "grg"
};
const ActionCategoryMap: Record<SpecialType, keyof ConfigPF2e["PF2E"]["actionCategories"]> = {
    offense: "offensive",
    defense: "defensive",
    general: "interaction",
}

function createEmptyData(): DeepPartial<NPCData> {
    return {
        data: {
            attributes: {},
            details: {},
            traits: {},
        }
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

    async parse(input: string, actor: NPCPF2e) {
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
                        value: tupleHasValue(Alignments, alignment) ? alignment : "N",
                    },
                    publicNotes: data.description,
                },
                traits: this.readTraits(data),
                saves: {
                    fortitude: { value: Number(data.fortitude.value) },
                    reflex: { value: Number(data.reflex.value) },
                    will: { value: Number(data.will.value) },
                },
            }
        });

        const items: DeepPartial<ItemSourcePF2e>[] = [];
        items.push(...(data.strikes ?? []).map(this.readStrike.bind(this)));
        items.push(...(data.specials ?? []).map(this.readAction.bind(this)));
        items.push(...this.readSkill(data));

        const spellParser = new SpellParser();
        const parsedSpells = await spellParser.readSpellcastingEntry(data)

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
        }
    }

    private readAttributes(data: MonsterData) {
      const speed = this.readSpeed(data);
      
      return {
        ac: { value: Number(data.ac.value) },
        perception: { value: Number(data.perception.value) },
        hp: { value: Number(data.hp.value), max: Number(data.hp.value) },
        allSaves: { value: data.savenote },
        speed: speed
      }
    }

    private readTraits(data: MonsterData): DeepPartial<NPCData["data"]["traits"]> {
        const traits = [data.type, ...data.traits.split(",")].map((trait) => trait.toLowerCase().trim());

        const rarity = traits.find((trait) => objectHasKey(CONFIG.PF2E.rarityTraits, trait));
        const languages = (data.languages?.split(",") ?? []).filter(
            (language): language is Language => objectHasKey(CONFIG.PF2E.languages, language),
        );
        const weaknesses = this.readWeaknesses(data);
        const resistances = this.readResistances(data);
        const immunities = this.readImmunities(data);
        
        return {
            size: { value: SizesMap[data.size] ?? "med" },
            rarity: (rarity ?? "common") as Rarity,
            languages: { value: languages },
            traits: { value: traits.filter((trait) => objectHasKey(CONFIG.PF2E.creatureTraits, trait)) },
            dv: weaknesses,
            dr: resistances,
            di: { value: immunities }
        }
    }

    private readSpeed(data: MonsterData): {} {
      let speeds = data.speed.split(',');
      
      let formattedSpeeds = {
        value: '',
        details: '',
        otherSpeeds: []
      }

      for (let speed of speeds) {
        speed = speed.replace('feet', '').trim();

        let splitSpeed = speed.split(';')
        
        let value = splitSpeed[0].match(/[0-9]+/g)[0]
        // extract type. If no type, then it's walking speed.
        
        let type = splitSpeed[0].match(/[A-Za-z]+/g)

        if (type && objectHasKey(CONFIG.PF2E.speedTypes, type[0])) {
          let otherSpeed = {
            type: type[0],
            value: value
          }
          formattedSpeeds.otherSpeeds.push(otherSpeed)
        } else {
          formattedSpeeds.value = value;
          if (splitSpeed.length > 1) {
            formattedSpeeds.details = splitSpeed[1]
          } else {
            formattedSpeeds.details = 'walking'
          }
        }
      }

      return formattedSpeeds;
    }

    private readResistances(data: MonsterData): any[] {
      let resistances = data.resistance.value.split('');

      let splitArray = [];
      let element = [];
      let openBracket = false;

      for (let i = 0; i <= resistances.length; i++) {
        let char = resistances[i];
        
        if (openBracket == false) {
          if (char == ',') {
            if (element.length) {
              splitArray.push(element.join(''))
              element = []
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
            splitArray.push(element.join(''))
            openBracket = false;
            element = []
          } else {
              element.push(char);
          }
        }
      }
      
      let formattedResistances = []
      for (let item of splitArray) {
        item = item.replace('or', '')
        item = item.trim('');
        
        let type = item.split('(')[0].match(/[A-Za-z]+/g);
        type = type.join('-').toLowerCase();
        let value = item.match(/[0-9]+/g);
        let exceptions = item.match(/(?<=\().*(?=\))/g);

        if (type == 'all-damage') {
          type = 'all';
        }
      
        formattedResistances.push({
          type: type,
          value: value[0],
          exceptions: exceptions
        })
      }
      
      return formattedResistances;
    }

    private readWeaknesses(data: MonsterData): any[] {
      let weaknesses = data.weakness.value.split(',');
    
      let formattedWeaknesses = [];
      for (let weakness of weaknesses) {
        // extract number value from weakness
        let value = weakness.match(/[0-9]+/g);
    
        // extract string from weakness
        let type = weakness.match(/[A-Za-z]+/g);
    
        if (type) {
          formattedWeaknesses.push({
            type: type.join('-').toLowerCase(),
            value: value
          })
        }
      }

      return formattedWeaknesses;
    }

    private readImmunities(data: MonsterData): any[] {
      var immunities = data.immunity.value.split(',');
    
      let formattedImmunity = [];
      for (let immunity of immunities) {
        // extract string from weakness
        let type = immunity.match(/[A-Za-z]+/g);
        
        if (type) {
          formattedImmunity.push(type.join('-').toLowerCase());
        }
      }
      return formattedImmunity;
    }

    private readAction(data: MonsterData["specials"][number]): DeepPartial<ActionSource> {
        const actionCostMap = {
            one: 1,
            two: 2,
            three: 3,
        } as const;

        const actionTypeMap = {
            none: "passive",
            free: "free",
            reaction: "reaction",
        } as const;

        const actionCost = ((): Partial<ActionSource["data"]> => {
            if (data.actions in actionCostMap) {
                return {
                    actionType: { value: "action" },
                    actions: { value: actionCostMap[data.actions] }
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
                description: { value: parseDescription(data.description) }
            }
        };
    }

    private readStrike(data: MonsterData["strikes"][number]): DeepPartial<MeleeSource> {
        const type = data.type?.toLowerCase() ?? "melee";
        const damageRolls: Record<string, MeleeDamageRoll> = {};
        const rollStrings = data.damage.split(" plus ");
        for (const rollString of rollStrings) {
            const match = rollString?.trim().match(/(\d+?d\d+[\+\-]?\d*)+(.*)?/);
            console.warn("roll string", rollString)
            console.warn("match", match)

            let damage;
            let damageType;
            if (!match) {
              damage = rollString
              damageType = "untyped";
            } else {
              damage = match[1];
              damageType = (() => {
                if (match[2]) {
                  const parts = match[2].split(" ").map(part => part.toLowerCase());
                  for (const part of parts) {
                    if (part in this.reverseDamageTypes) {
                      return this.reverseDamageTypes[part];
                    }
                  }
                } else {
                  return "untyped";
                }
              })();
            }

            
            damageRolls[randomID()] = { damage, damageType };
        }

        return {
            name: data.name,
            type: "melee",
            data: {
                bonus: { value: Number(data.attack) },
                weaponType: { value: type === "melee" ? "melee" : "ranged" },
                damageRolls
            }
        };
    }

    private readSkill(data: MonsterData): DeepPartial<LoreSource>[]   {
      const skills = [
        "Acrobatics", 
        "Arcana", 
        "Athletics", 
        "Crafting", 
        "Deception", 
        "Diplomacy", 
        "Intimidation", 
        "Lore", 
        "Medicine", 
        "Nature", 
        "Occultism", 
        "Performance", 
        "Religion", 
        "Society", 
        "Stealth", 
        "Survival", 
        "Thievery"
      ]

      const skillModel = {
        _id: '',
        type: 'lore',
        name: data.name,
        data: {
          mod: {
            value: ''
          },
          proficient: {
              value: 0
          },
        }
      }

      let skillsList = []

      for (const [key, value] of Object.entries(data)) {
        var capitalizedSkill = key.charAt(0).toUpperCase() + key.slice(1)
        if (skills.includes(capitalizedSkill)) {
          if (value.value) {
            let newSkill = Object.assign({}, skillModel);

            newSkill._id = randomID();
            newSkill.name = capitalizedSkill
            newSkill.data.mod.value = value.value;
            
            skillsList.push(newSkill)
          }
        }
      }
  
      return skillsList;
    }
}




const CONDITION_COMPENDIUM = "@Compendium[pf2e.conditionitems.";

function parseDescription(text: string) {
    let string = "<p>" + text.replaceAll("’", "'")
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
        .replaceAll("Cost", "<strong>Cost</strong>") + "</p>";
    string = string.replaceAll("<p><p>", "<p>")
        .replaceAll("–", "-")
        .replaceAll("”", "\"")
        .replaceAll("“", "\"")

    string = string.replaceAll("Maximum Duration", "</p><p><strong>Maximum Duration</strong>")
        .replaceAll("Onset", "</p><p><strong>Onset</strong>")
        .replaceAll("Saving Throw", "</p><p><strong>Saving Throw</strong>");
    string = string.replace(/Stage (\d)/, "</p><p><strong>Stage $1</strong>");

    string = string.replaceAll(" </p>", "</p>");

    string = string.replace(/Activate \?/, "</p><p><strong>Activate</strong> <span class='pf2-icon'>1</span>");

    // // Skills and saves
    string = string.replace(/DC (\d+) basic (\w+) save/, "<span data-pf2-check='$2' data-pf2-traits='damaging-effect' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='gm'>basic $2</span> save")
    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "<span data-pf2-check='$2' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='gm'>$2</span>")
    string = string.replace(/(Reflex|Will|Fortitude) DC (\d+)/, "<span data-pf2-check='$1' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$2' data-pf2-show-dc='gm'>$1</span>")
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "<span data-pf2-check='$1' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$2' data-pf2-show-dc='gm'>$1</span>")
    string = string.replace(/(Reflex|Will|Fortitude) save \(DC (\d+)\)/, "<span data-pf2-check='$1' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$2' data-pf2-show-dc='gm'>$1</span>")

    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "<span data-pf2-check='$2' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='gm'>$2</span>")
    string = string.replace(/(Reflex|Will|Fortitude) DC (\d+)/, "<span data-pf2-check='$1' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$2' data-pf2-show-dc='gm'>$1</span>")
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "<span data-pf2-check='$1' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$2' data-pf2-show-dc='gm'>$1</span>")

    string = string.replace(/(\w+) Lore DC (\d+)/, "<span data-pf2-check='$2' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='gm'>$2 Lore</span>")
    string = string.replace(/DC (\d+) (\w+) save/, "<span data-pf2-check='$2' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='gm'>$2</span> save")
    string = string.replace(/DC (\d+) flat check/, "<span data-pf2-check='flat' data-pf2-traits='' data-pf2-label='' data-pf2-dc='$1' data-pf2-show-dc='owner'>Flat Check</span>")

    // Catch capitalized saves
    //string = string.replace(/check='(Reflex|Will|Fortitude)'/, convert_to_lower)
    //string = string.replace(/check='%s'/ % SKILLS, convert_to_lower)

    // Damage rolls
    string = string.replace(/ (\d)d(\d) (rounds|minutes|hours|days)/, " [[/r $1d$2 #$3]]{$1d$2 $3}")
    string = string.replace(/ (\d+) (\w*) damage/, " [[/r {$1}[$2]]]{$1 $2 Damage}")
    string = string.replace(/(\d+)d(\d+)\+(\d+) (\w*) damage/, "[[/r {$1d$2 + $3}[$4]]]{$1d$2 + $3 $4 damage}")
    string = string.replace(/(\d+)d(\d+) persistent (\w*) damage/,
                    `[[/r {$1d$2}[persistent,$3]]]{$1d$2} ${CONDITION_COMPENDIUM}Persistent Damage]{Persistent $3 Damage}`)
    string = string.replace(/(\d+)d(\d+) (\w*) damage/, "[[/r {$1d$2}[$3]]]{$1d$2 $3 damage}")
    string = string.replace(/(\d+)d(\d+) (\w+)(\,|\.)/, "[[/r $1d$2 #$3]]{$1d$2 $3}$4")
    string = string.replace(/(\d+)d(\d+)\./, "[[/r $1d$2]]{$1d$2}.")

    // Spell heightening handling
    string = string.replace("Heightened (", "<hr />Heightened (")
    string = string.replace(/Heightened \(\+(\d+)\)/, "</p><p><strong>Heightened (+$1)</strong>")
    string = string.replace(/Heightened \((\d+)(\w+)\)/, "</p><p><strong>Heightened ($1$2)</strong>")
    string = string.replaceAll("<hr /></p><p><strong>Heightened", "</p><hr /><p><strong>Heightened")

    // Removing bullet points, should replace with the actual bullet points.
    string = string.replace("•", "<ul><li>")
    string = string.replaceAll("•", "</li><li>")

    // Add template buttons
    string = string.replace(/(\d+)-foot (emanation|burst|cone|line)/, "@Template[type:$2|distance:$1]")

    // string = handle_actions(string)
    // string = handle_conditions(string)
    // string = handle_equipment(string)
    // string = handle_feats(string)
    // string = handle_spells(string)
    // string = handle_activation_actions(string)

    return string;
}
