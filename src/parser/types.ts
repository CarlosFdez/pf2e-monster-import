import example from "../examples/monstrous-dandelion.json";
import malfunctioningRepairDrone from "../examples/malfunctioning-repair-drone.json";
import cillianCreed from "../examples/CillianCreed1646282563.json";
import kateGlenn from "../examples/KateGlenn1645159516.json";
import { ItemSourcePF2e } from "@item/base/data";

export type MonsterDataExample = typeof malfunctioningRepairDrone & typeof example & typeof cillianCreed;

/** This is the type of the "specials" section of the input format */
export type SpecialType = "offense" | "general" | "defense";

/** Type refinements over the example types */
interface MonsterDataGood {
    languages?: string;
    specials: {
        id: string;
        name: string;
        traits: string;
        actions: "none" | "one" | "two" | "three";
        type: SpecialType;
        description: string;
    }[];
    morespells?: (typeof kateGlenn)["morespells"];
    strikes: {
        id: string;
        name: string;
        traits: string;
        attack: number | string;
        damage: string;
        type: string;
    }[];
    speed: number | string;
}

export interface MonsterSpellStats {
    spellattack: {
        value: string | number;
        benchmark: string;
        note: string;
    };
    spelldc: (typeof kateGlenn)["spelldc"];
    spells: (typeof kateGlenn)["spells"];
    focuspoints: (typeof kateGlenn)["focuspoints"];
}

export type MonsterData = MonsterDataGood & MonsterSpellStats & Omit<MonsterDataExample, keyof MonsterDataGood>;

export interface MonsterParseResults {
    updates: Record<string, unknown>;
    items: DeepPartial<ItemSourcePF2e>[];
    parsedSpells: DeepPartial<ItemSourcePF2e>[];
}
