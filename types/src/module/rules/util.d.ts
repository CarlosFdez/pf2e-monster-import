import { DeferredValueParams, ModifierPF2e } from "@actor/modifiers";
import { RollNotePF2e } from "@module/notes";
import { DeferredModifier } from "./rule-element/data";
/** Extracts a list of all cloned modifiers across all given keys in a single list. */
export declare function extractModifiers(modifiers: Record<string, DeferredModifier[]>, selectors: string[], options?: DeferredValueParams): ModifierPF2e[];
/** Extracts a list of all cloned notes across all given keys in a single list. */
export declare function extractNotes(rollNotes: Record<string, RollNotePF2e[]>, selectors: string[]): RollNotePF2e[];
