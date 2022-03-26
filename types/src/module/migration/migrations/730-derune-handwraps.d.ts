import { ItemSourcePF2e } from "@item/data";
import { MigrationBase } from "../base";
/** Remove Potency and Striking rule elements from handwraps of mighty blows */
export declare class Migration730DeruneHandwraps extends MigrationBase {
    static version: number;
    updateItem(source: ItemSourcePF2e): Promise<void>;
}
