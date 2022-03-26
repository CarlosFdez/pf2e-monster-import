import { ItemPF2e } from "@item";
import { UserPF2e } from "@module/user";
import { DeityData } from "./data";
import { DeitySheetPF2e } from "./sheet";
declare class DeityPF2e extends ItemPF2e {
    static get schema(): typeof DeityData;
    prepareActorData(this: Embedded<DeityPF2e>): void;
    /** For now there is support for PCs having a single patron deity */
    _preCreate(data: PreDocumentId<this["data"]["_source"]>, options: DocumentModificationContext<this>, user: UserPF2e): Promise<void>;
}
interface DeityPF2e extends ItemPF2e {
    readonly data: DeityData;
    readonly _sheet: DeitySheetPF2e;
}
export { DeityPF2e };
