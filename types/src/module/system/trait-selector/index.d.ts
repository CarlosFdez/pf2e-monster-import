export { TagSelectorBasic } from './basic';
export { TraitSelectorResistances } from './resistances';
export { TraitSelectorSenses } from './senses';
export { TraitSelectorSpeeds } from './speeds';
export { TraitSelectorWeaknesses } from './weaknesses';
export interface BasicSelectorOptions extends FormApplicationOptions {
    objectProperty: string;
    configTypes: SelectableTagField[];
    allowCustom?: boolean;
    customChoices?: Record<string, string>;
}
export interface TagSelectorOptions extends FormApplicationOptions, Partial<BasicSelectorOptions> {
}
export declare const TAG_SELECTOR_TYPES: readonly ["basic", "resistances", "senses", "speed-types", "weaknesses"];
export declare type TagSelectorType = typeof TAG_SELECTOR_TYPES[number];
export declare const SELECTABLE_TAG_FIELDS: readonly ["abilities", "skills", "martialSkills", "currencies", "saves", "armorTraits", "preciousMaterialGrades", "armorPotencyRunes", "armorResiliencyRunes", "armorPropertyRunes", "weaponPotencyRunes", "weaponStrikingRunes", "weaponPropertyRunes", "rarityTraits", "damageTypes", "weaponDamage", "healingTypes", "weaponTypes", "weaponGroups", "consumableTraits", "weaponDescriptions", "weaponTraits", "traitsDescriptions", "weaponHands", "equipmentTraits", "itemBonuses", "damageDie", "weaponRange", "weaponMAP", "weaponReload", "armorTypes", "armorGroups", "consumableTypes", "magicTraditions", "preparationType", "spellTraits", "featTraits", "areaTypes", "areaSizes", "classTraits", "ancestryTraits", "alignment", "skillList", "spellComponents", "spellTypes", "spellTraditions", "spellLevels", "featTypes", "featActionTypes", "actionTypes", "actionTypes", "actionsNumber", "actionCategories", "proficiencyLevels", "heroPointLevels", "actorSizes", "bulkTypes", "conditionTypes", "immunityTypes", "resistanceTypes", "weaknessTypes", "languages", "creatureTraits", "monsterTraits", "spellScalingModes", "attackEffects", "hazardTraits", "attributes", "speedTypes", "senses", "preciousMaterials", "prerequisitePlaceholders", "ancestryItemTraits", "levels", "dcAdjustments"];
export declare type SelectableTagField = typeof SELECTABLE_TAG_FIELDS[number];
