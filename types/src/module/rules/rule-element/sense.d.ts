import { RuleElementPF2e, RuleElementData, RuleElementSource } from "./";
import { CharacterPF2e, FamiliarPF2e } from "@actor";
import { ActorType } from "@actor/data";
import { ItemPF2e } from "@item";
import { SenseAcuity, SenseType } from "@actor/creature/sense";
import { RuleElementOptions } from "./base";
/**
 * @category RuleElement
 */
export declare class SenseRuleElement extends RuleElementPF2e {
    protected static validActorTypes: ActorType[];
    constructor(data: SenseRuleElementSource, item: Embedded<ItemPF2e>, options?: RuleElementOptions);
    beforePrepareData(): void;
}
export interface SenseRuleElement {
    get actor(): CharacterPF2e | FamiliarPF2e;
    data: SenseRuleElementData;
}
interface SenseRuleElementData extends RuleElementData {
    label: string;
    force: boolean;
    acuity: SenseAcuity;
    range: string | number;
    selector: SenseType;
}
interface SenseRuleElementSource extends RuleElementSource {
    acuity?: string;
    range?: string | number | null;
    force?: boolean;
}
export {};
