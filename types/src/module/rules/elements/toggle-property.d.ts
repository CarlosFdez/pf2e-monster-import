import { CharacterData, NPCData } from '@actor/data';
import { RuleElementPF2e } from '../rule-element';
/**
 * @category RuleElement
 */
export declare class PF2TogglePropertyRuleElement extends RuleElementPF2e {
    onBeforePrepareData(actorData: CharacterData | NPCData): void;
}
