import { ItemSourcePF2e } from "@item/data";
import { MigrationBase } from "../base";
export declare class Migration616MigrateFeatPrerequisites extends MigrationBase {
    static version: number;
    updateItem(source: ItemSourcePF2e): Promise<void>;
}
