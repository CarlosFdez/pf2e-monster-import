import type { SpellPF2e } from "./index.ts";
declare function createSpellRankLabel(spell: SpellPF2e, castRank?: number): string;
declare function createDescriptionPrepend(spell: SpellPF2e, { includeTraditions }: {
    includeTraditions: boolean;
}): Promise<string>;
declare function getPassiveDefenseLabel(statistic: string, { localize }?: {
    localize?: boolean | undefined;
}): string | null;
export { createDescriptionPrepend, createSpellRankLabel, getPassiveDefenseLabel };
