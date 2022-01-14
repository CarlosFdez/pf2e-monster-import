import { Size } from "@pf2e/module/data";

interface SizeDimensions {
    length: number;
    width: number;
}

export class ActorSizePF2e {
    /** The size category of this category */
    value: Size;
    /** The length dimension of this actor's space */
    length: number;
    /** The width dimension of this actor's space */
    width: number;
}
