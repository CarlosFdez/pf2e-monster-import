import { ItemSourcePF2e } from "@item/data";
import { MigrationBase } from "../base";
/** Remove properties from unused "activatedEffect" template defaults */
export declare class Migration807RMActivatedEffectFields extends MigrationBase {
    static version: number;
    updateItem(source: ItemSourceWithDeletions): Promise<void>;
}
type ActivatedEffectKey = "activation" | "duration" | "range" | "target" | "uses";
type ItemSourceWithDeletions = ItemSourcePF2e & {
    system: {
        [K in ActivatedEffectKey | `-=${ActivatedEffectKey}`]?: unknown;
    };
};
export {};
