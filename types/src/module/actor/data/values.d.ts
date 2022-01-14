import { SkillAbbreviation } from '@actor/creature/data';
import { ATTACK_TYPES, DAMAGE_CATEGORIES, DAMAGE_TRAITS, DAMAGE_TYPES } from '@pf2e/module/damage-calculation';
import { AbilityString } from './base';
export declare const ABILITY_ABBREVIATIONS: readonly ["str", "dex", "con", "int", "wis", "cha"];
export declare const CREATURE_ACTOR_TYPES: readonly ["character", "npc", "familiar"];
export declare const SAVE_TYPES: readonly ["fortitude", "reflex", "will"];
export declare const ALIGNMENT_TRAITS: readonly ["chaotic", "evil", "good", "lawful"];
export declare const CONDITION_TYPES: readonly ["blinded", "broken", "clumsy", "concealed", "confused", "controlled", "dazzled", "deafened", "doomed", "drained", "dying", "encumbered", "enfeebled", "fascinated", "fatigued", "flat-footed", "fleeing", "friendly", "frightened", "grabbed", "helpful", "hidden", "hostile", "immobilized", "indifferent", "invisible", "observed", "paralyzed", "persistent", "petrified", "prone", "quickened", "restrained", "sickened", "slowed", "stunned", "stupefied", "unconscious", "undetected", "unfriendly", "unnoticed", "wounded"];
type SetType<S> = S extends Set<infer T> ? T : never
export declare const IMMUNITY_TYPES: Set<
    typeof CONDITION_TYPES[number] |
    SetType<typeof DAMAGE_CATEGORIES> |
    SetType<typeof DAMAGE_TRAITS> |
    SetType<typeof DAMAGE_TYPES> |
    "abjuration" |
    "conjuration" |
    "divination" |
    "enchantment" |
    "evocation" |
    "illusion" |
    "necromancy" |
    "transmutation" |
    "area-damage" |
    "auditory" |
    "confusion" |
    "critical-hits" |
    "curse" |
    "detection" |
    "death-effects" |
    "disease" |
    "emotion" |
    "fear-effects" |
    "healing" |
    "inhaled" |
    "nonlethal-attacks" |
    "nonmagical-attacks" |
    "object-immunities" |
    "olfactory" |
    "polymorph" |
    "possession" |
    "precision" |
    "scrying" |
    "sleep" |
    "spellDeflection" |
    "swarm-attacks" |
    "swarm-mind" |
    "trip" |
    "visual">;

export declare const WEAKNESS_TYPES: Set<
    SetType<typeof ATTACK_TYPES> |
    SetType<typeof DAMAGE_CATEGORIES> |
    SetType<typeof DAMAGE_TRAITS> |
    SetType<typeof DAMAGE_TYPES> |
    "area-damage" |
    "axe" |
    "critical-hits" |
    "emotion" |
    "precision" |
    "splash-damage" |
    "vampire-weaknesses" |
    "vorpal" |
    "vorpal-fear" |
    "vulnerable-to-sunlight"
>;

export declare const RESISTANCE_TYPES: Set<
    SetType<typeof ATTACK_TYPES> |
    SetType<typeof DAMAGE_TRAITS> |
    SetType<typeof DAMAGE_TYPES> |
    SetType<typeof DAMAGE_CATEGORIES> |
    "all" |
    "area-damage" |
    "critical-hits" |
    "protean anatomy"
>;

export declare const SKILL_ABBREVIATIONS: readonly ["acr", "arc", "ath", "cra", "dec", "dip", "itm", "med", "nat", "occ", "prf", "rel", "soc", "ste", "sur", "thi"];
export declare const SKILL_DICTIONARY: {
    acr: string;
    arc: string;
    ath: string;
    cra: string;
    dec: string;
    dip: string;
    itm: string;
    med: string;
    nat: string;
    occ: string;
    prf: string;
    rel: string;
    soc: string;
    ste: string;
    sur: string;
    thi: string;
};
interface SkillExpanded {
    ability: AbilityString;
    shortform: SkillAbbreviation;
}
export declare const SKILL_EXPANDED: Record<string, SkillExpanded>;
export declare const SUPPORTED_ROLL_OPTIONS: string[];
export {};
