import { ItemSourcePF2e } from "@item/data";
import { MigrationBase } from "../base";
/** Replace inline HTML in roll note text with separate title and visibility */
export declare class Migration760SeparateNoteTitle extends MigrationBase {
    #private;
    static version: number;
    updateItem(source: ItemSourcePF2e): Promise<void>;
}
