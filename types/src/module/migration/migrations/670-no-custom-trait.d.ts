import { ItemSourcePF2e } from "@item/data";
import { MigrationBase } from "../base";
/** Remove the "custom" trait that snuck into item traits */
export declare class Migration670NoCustomTrait extends MigrationBase {
    static version: number;
    updateItem(itemSource: ItemSourcePF2e): Promise<void>;
}
