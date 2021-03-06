import { ActionType, ItemLevelData, ItemSystemData, ItemTraits } from "@item/data/base";
import { BaseNonPhysicalItemData, BaseNonPhysicalItemSource } from "@item/data/non-physical";
import { OneToThree } from "@module/data";
import { FeatPF2e } from ".";
import { FEAT_TYPES } from "./values";
export declare type FeatSource = BaseNonPhysicalItemSource<"feat", FeatSystemSource>;
export declare class FeatData extends BaseNonPhysicalItemData<FeatPF2e> {
    static DEFAULT_ICON: ImagePath;
}
export interface FeatData extends Omit<FeatSource, "effects" | "flags"> {
    type: "feat";
    data: FeatSystemData;
    readonly _source: FeatSource;
}
export declare type FeatTrait = keyof ConfigPF2e["PF2E"]["featTraits"];
export declare type FeatTraits = ItemTraits<FeatTrait>;
export declare type FeatType = SetElement<typeof FEAT_TYPES>;
export interface PrerequisiteTagData {
    value: string;
}
export interface FeatSystemSource extends ItemSystemData, ItemLevelData {
    traits: FeatTraits;
    featType: {
        value: FeatType;
    };
    /** Whether this feat must be taken at character level 1 */
    onlyLevel1: boolean;
    /** The maximum number of times this feat can be taken by a character. A value of `null` indicates no limit */
    maxTakable: number | null;
    actionType: {
        value: ActionType;
    };
    actionCategory: {
        value: string;
    };
    actions: {
        value: OneToThree | null;
    };
    prerequisites: {
        value: PrerequisiteTagData[];
    };
    location: string | null;
}
export interface FeatSystemData extends Omit<FeatSystemSource, "maxTaken"> {
    /** `null` is set to `Infinity` during data preparation */
    maxTakable: number;
}
