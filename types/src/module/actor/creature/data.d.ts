import { AbilityString, ActorSystemData, ActorSystemSource, BaseActorDataPF2e, BaseActorSourcePF2e, BaseTraitsData, HitPointsData, AbilityBasedStatistic, Rollable, StrikeData, InitiativeData, BaseActorAttributes } from "@actor/data/base";
import type { CREATURE_ACTOR_TYPES, SKILL_ABBREVIATIONS } from "@actor/data/values";
import { CheckModifier, DamageDicePF2e, ModifierPF2e, RawModifier, StatisticModifier } from "@actor/modifiers";
import { LabeledValue, ValueAndMax, ValuesList, ZeroToThree, ZeroToTwo } from "@module/data";
import type { CreaturePF2e } from ".";
import { SaveType } from "@actor/data";
import { CreatureSensePF2e, SenseAcuity, SenseType } from "./sense";
import { RollDataPF2e, RollParameters } from "@system/rolls";
import { CombatantPF2e } from "@module/encounter";
import { Statistic, StatisticCompatData } from "@system/statistic";
import { CreatureTraits } from "@item/ancestry/data";
import { Alignment, AlignmentTrait } from "./types";
export declare type BaseCreatureSource<TCreatureType extends CreatureType = CreatureType, TSystemSource extends CreatureSystemSource = CreatureSystemSource> = BaseActorSourcePF2e<TCreatureType, TSystemSource>;
export declare class BaseCreatureData<TActor extends CreaturePF2e = CreaturePF2e, TSystemData extends CreatureSystemData = CreatureSystemData> extends BaseActorDataPF2e<TActor> {
}
export interface BaseCreatureData extends Omit<BaseCreatureSource, "effects" | "flags" | "items" | "token"> {
    readonly type: CreatureType;
    data: CreatureSystemData;
    readonly _source: BaseCreatureSource;
}
/** Skill and Lore statistics for rolling */
export declare type CreatureSkills = Record<SkillAbbreviation, Statistic> & Partial<Record<string, Statistic>>;
export interface CreatureSystemSource extends ActorSystemSource {
    details: Record<string, unknown>;
    /** Traits, languages, and other information. */
    traits?: CreatureTraitsData;
    /** Maps roll types -> a list of modifiers which should affect that roll type. */
    customModifiers?: Record<string, RawModifier[]>;
    /** Saving throw data */
    saves?: Record<SaveType, {
        value?: number;
        mod?: number;
    }>;
}
export interface CreatureSystemData extends CreatureSystemSource, ActorSystemData {
    details: {
        alignment: {
            value: Alignment;
        };
        level: {
            value: number;
        };
    };
    /** Traits, languages, and other information. */
    traits: CreatureTraitsData;
    attributes: CreatureAttributes;
    /** Maps roll types -> a list of modifiers which should affect that roll type. */
    customModifiers: Record<string, ModifierPF2e[]>;
    /** Maps damage roll types -> a list of damage dice which should be added to that damage roll type. */
    damageDice: Record<string, DamageDicePF2e[]>;
    /** Saving throw data */
    saves: CreatureSaves;
    actions?: StrikeData[];
}
export declare type CreatureType = typeof CREATURE_ACTOR_TYPES[number];
export interface SenseData {
    type: SenseType;
    acuity?: SenseAcuity;
    value: string;
    source?: string;
}
/** Data describing the value & modifier for a base ability score. */
export interface AbilityData {
    /** The raw value of this ability score; computed from the mod for npcs automatically. */
    value: number;
    /** The modifier for this ability; computed from the value for characters automatically. */
    mod: number;
}
export declare type SkillAbbreviation = typeof SKILL_ABBREVIATIONS[number];
export declare type Abilities = Record<AbilityString, AbilityData>;
/** A type representing the possible ability strings. */
export declare type Language = keyof ConfigPF2e["PF2E"]["languages"];
export declare type Attitude = keyof ConfigPF2e["PF2E"]["attitude"];
export declare type CreatureTrait = keyof ConfigPF2e["PF2E"]["creatureTraits"] | AlignmentTrait;
export interface CreatureTraitsData extends BaseTraitsData {
    traits: BaseTraitsData["traits"] & {
        /** Actual Pathfinder traits */
        traits: CreatureTraits;
    };
    /** A list of special senses this character has. */
    senses: CreatureSensePF2e[];
    /** Languages which this actor knows and can speak. */
    languages: ValuesList<Language>;
    /** Attitude, describes the attitude of a npc towards the PCs, e.g. hostile, friendly */
    attitude: {
        value: Attitude;
    };
}
export declare type SkillData = StatisticModifier & AbilityBasedStatistic & Rollable;
/** The full save data for a character; including its modifiers and other details */
export declare type SaveData = StatisticCompatData & AbilityBasedStatistic & {
    saveDetail?: string;
};
export declare type CreatureSaves = Record<SaveType, SaveData>;
/** Miscallenous but mechanically relevant creature attributes.  */
export interface CreatureAttributes extends BaseActorAttributes {
    hp: CreatureHitPoints;
    ac: {
        value: number;
    };
    hardness?: {
        value: number;
    };
    perception: {
        value: number;
    };
    speed: CreatureSpeeds;
}
export interface CreatureSpeeds extends StatisticModifier {
    /** The actor's primary speed (usually walking/stride speed). */
    value: string;
    /** Other speeds that this actor can use (such as swim, climb, etc). */
    otherSpeeds: LabeledSpeed[];
    /** The derived value after applying modifiers, bonuses, and penalties */
    total: number;
}
export declare type MovementType = "land" | "burrow" | "climb" | "fly" | "swim";
export interface LabeledSpeed extends LabeledValue {
    type: Exclude<MovementType, "land">;
    value: string;
    label: string;
}
export interface CreatureHitPoints extends HitPointsData {
    negativeHealing: boolean;
}
export interface InitiativeRollParams extends RollParameters {
    /** Whether the encounter tracker should be updated with the roll result */
    updateTracker?: boolean;
    skipDialog: boolean;
}
export interface InitiativeRollResult {
    combatant: CombatantPF2e;
    roll: Rolled<Roll<RollDataPF2e>>;
}
export declare type CreatureInitiative = InitiativeData & CheckModifier & {
    roll: (parameters: InitiativeRollParams) => Promise<InitiativeRollResult | null>;
    /**
     * If a pair of initiative rolls are tied, the next resolution step is the tiebreak priority. A lower value
     * constitutes a higher priority.
     */
    tiebreakPriority: ZeroToTwo;
};
export declare enum VisionLevels {
    BLINDED = 0,
    NORMAL = 1,
    LOWLIGHT = 2,
    DARKVISION = 3
}
export declare type VisionLevel = ZeroToThree;
/** A PC's or NPC's held shield. An NPC's values can be stored directly on the actor or come from a shield item. */
export interface HeldShieldData {
    /** The item ID of the shield if in use or otherwise `null` */
    itemId: string | null;
    /** The name of the shield (defaulting to "Shield" if not from a shield item) */
    name: string;
    /** The shield's AC */
    ac: number;
    /** The shield's hardness */
    hardness: number;
    /** The shield's broken threshold */
    brokenThreshold: number;
    /** The shield's hit points */
    hp: ValueAndMax;
    /** Whether the shield is raised */
    raised: boolean;
    /** Whether the shield is broken */
    broken: boolean;
    /** Whether the shield is destroyed (hp.value === 0) */
    destroyed: boolean;
    /** An effect icon to use when the shield is raised */
    icon: ImagePath;
}
