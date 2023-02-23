import { ActorPF2e } from "@actor";
import { ItemPF2e } from "@item";

export {};

declare global {
    interface String {
        toLowerCase<T extends string>(this: T): Lowercase<T>;
    }

    class Hooks {
        static on(
            ...args: HookParameters<"renderActorSheet", [sheet: ActorSheet<ActorPF2e, ItemPF2e>, $html: JQuery]>
        ): number;
    }
}
