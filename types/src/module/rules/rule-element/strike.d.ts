import { RuleElementPF2e, RuleElementData, RuleElementSource } from "./";
import { CharacterPF2e, NPCPF2e } from "@actor";
import { ActorType } from "@actor/data";
import { ItemPF2e, WeaponPF2e } from "@item";
import { BaseWeaponType, WeaponCategory, WeaponDamage, WeaponGroup, WeaponRangeIncrement, WeaponTrait } from "@item/weapon/data";
import { RuleElementOptions } from "./base";
/**
 * Create an ephemeral strike on an actor
 * @category RuleElement
 */
declare class StrikeRuleElement extends RuleElementPF2e {
    protected static validActorTypes: ActorType[];
    weapon: Embedded<WeaponPF2e>;
    constructor(data: StrikeSource, item: Embedded<ItemPF2e>, options?: RuleElementOptions);
    beforePrepareData(): void;
    /** Exclude other strikes if this rule element specifies that its strike replaces all others */
    afterPrepareData(): void;
    private constructWeapon;
}
interface StrikeRuleElement {
    data: StrikeData;
    get actor(): CharacterPF2e | NPCPF2e;
}
interface StrikeSource extends RuleElementSource {
    img?: unknown;
    category?: unknown;
    group?: unknown;
    baseType?: unknown;
    damage?: unknown;
    range?: unknown;
    traits?: unknown;
    replaceAll?: unknown;
    replaceBasicUnarmed?: unknown;
    options?: unknown;
}
interface StrikeData extends RuleElementData {
    slug?: string;
    img?: ImagePath;
    category: WeaponCategory;
    group: WeaponGroup;
    baseType: BaseWeaponType | null;
    damage?: {
        base?: WeaponDamage;
    };
    range: WeaponRangeIncrement | null;
    traits: WeaponTrait[];
    replaceAll: boolean;
    replaceBasicUnarmed: boolean;
    options?: string[];
}
export { StrikeRuleElement };
