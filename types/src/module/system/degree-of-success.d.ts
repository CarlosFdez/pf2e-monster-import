import { DCSlug } from "@actor/types";
import { ZeroToThree } from "@module/data";
import { CheckRoll } from "./check";
import { PredicatePF2e } from "./predication";
/** Get the degree of success from a roll and a difficulty class */
declare class DegreeOfSuccess {
    #private;
    /** The calculated degree of success */
    readonly value: DegreeOfSuccessIndex;
    /** The degree of success prior to adjustment. If there was no adjustment, it is identical to the `value` */
    readonly unadjusted: DegreeOfSuccessIndex;
    /** A degree adjustment, usually from some character ability */
    readonly adjustment: {
        label: string;
        amount: DegreeAdjustmentAmount;
    } | null;
    /** The result of a d20 roll */
    readonly dieResult: number;
    /** The total of a roll, including the die result and total modifier */
    readonly rollTotal: number;
    /** The check DC being rolled against */
    readonly dc: CheckDC;
    constructor(roll: Rolled<CheckRoll> | RollBrief, dc: CheckDC | number, dosAdjustments?: DegreeAdjustmentsRecord | null);
    static readonly CRITICAL_FAILURE = 0;
    static readonly FAILURE = 1;
    static readonly SUCCESS = 2;
    static readonly CRITICAL_SUCCESS = 3;
}
type RollBrief = {
    dieValue: number;
    modifier: number;
};
declare const DEGREE_ADJUSTMENT_AMOUNTS: {
    readonly LOWER_BY_TWO: -2;
    readonly LOWER: -1;
    readonly INCREASE: 1;
    readonly INCREASE_BY_TWO: 2;
};
type DegreeAdjustmentAmount = typeof DEGREE_ADJUSTMENT_AMOUNTS[keyof typeof DEGREE_ADJUSTMENT_AMOUNTS];
type DegreeAdjustmentsRecord = {
    [key in "all" | DegreeOfSuccessString]?: {
        label: string;
        amount: DegreeAdjustmentAmount;
    };
};
interface DegreeOfSuccessAdjustment {
    adjustments: DegreeAdjustmentsRecord;
    predicate?: PredicatePF2e;
}
interface CheckDC {
    slug?: DCSlug;
    label?: string;
    scope?: "attack" | "check";
    value: number;
    visible?: boolean;
}
declare const DEGREE_OF_SUCCESS: {
    readonly CRITICAL_SUCCESS: 3;
    readonly SUCCESS: 2;
    readonly FAILURE: 1;
    readonly CRITICAL_FAILURE: 0;
};
type DegreeOfSuccessIndex = ZeroToThree;
declare const DEGREE_OF_SUCCESS_STRINGS: readonly ["criticalFailure", "failure", "success", "criticalSuccess"];
type DegreeOfSuccessString = typeof DEGREE_OF_SUCCESS_STRINGS[number];
export { CheckDC, DEGREE_ADJUSTMENT_AMOUNTS, DEGREE_OF_SUCCESS, DEGREE_OF_SUCCESS_STRINGS, DegreeAdjustmentAmount, DegreeAdjustmentsRecord, DegreeOfSuccess, DegreeOfSuccessAdjustment, DegreeOfSuccessIndex, DegreeOfSuccessString, RollBrief, };
