import { RuleElementPF2e } from '../rule-element';
import { CharacterData, FamiliarData, NPCData } from '@actor/data';
/**
 * @category RuleElement
 */
export declare class PF2ActorTraits extends RuleElementPF2e {
    onBeforePrepareData(actorData: CharacterData | NPCData | FamiliarData): void;
}
