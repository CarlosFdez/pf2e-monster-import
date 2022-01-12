import { RuleElementPF2e } from '../rule-element';
import { RuleElementSyntheticsPF2e } from '../rules-data-definitions';
import { CharacterData, NPCData } from '@actor/data';
/**
 * @category RuleElement
 */
export declare class PF2FlatModifierRuleElement extends RuleElementPF2e {
    onBeforePrepareData(actorData: CharacterData | NPCData, { statisticsModifiers }: RuleElementSyntheticsPF2e): void;
}
