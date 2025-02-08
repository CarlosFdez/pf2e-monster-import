import { sluggify } from "../util";

export function parseDescription(text: string): string {
    let string = text
        .replaceAll("’", "'")
        .replaceAll("Trigger", "<p><strong>Trigger</strong>")
        .replaceAll("\nCritical Success", "</p><hr /><p><strong>Critical Success</strong>")
        .replaceAll("\nSuccess", "</p><p><strong>Success</strong>")
        .replaceAll("\nFailure", "</p><p><strong>Failure</strong>")
        .replaceAll("\nCritical Failure", "</p><p><strong>Critical Failure</strong>")
        .replaceAll("\nSpecial", "</p><p><strong>Special</strong>")
        .replaceAll("\n", " ")
        .replaceAll("Frequency", "<p><strong>Frequency</strong>")
        .replaceAll("Effect", "</p><p><strong>Effect</strong>")
        .replaceAll("—", "-")
        .replaceAll("Cost", "<strong>Cost</strong>");
    string = `<p>${string}</p>`
        .replaceAll("<p><p>", "<p>")
        .replaceAll("–", "-")
        .replaceAll("”", '"')
        .replaceAll("“", '"');

    string = string
        .replaceAll("Maximum Duration", "</p><p><strong>Maximum Duration</strong>")
        .replaceAll("Onset", "</p><p><strong>Onset</strong>")
        .replaceAll("Saving Throw", "</p><p><strong>Saving Throw</strong>")
        .replaceAll(/(Requirements|Requirement)/g, "</p><p><strong>Requirements</strong>")
        .replaceAll(" Craft </p><p><strong>Requirements</strong>", "</p><hr /><p><strong>Craft Requirements</strong>")
        .replaceAll(/Activate \?/g, "</p><p><strong>Activate</strong> <span class='pf2-icon'>1</span>")
        .replaceAll(/Stage (\d)/g, "</p><p><strong>Stage $1</strong>");

    // Extra sanitation
    string = string.replaceAll(" </p>", "</p>").replaceAll(/^<p>(\s|&nbsp;)?<\/p>/g, "");

    // Skills and saves
    string = handleInlineChecks(string);

    // Damage rolls
    string = handleDamageRolls(string);

    // Conditions
    string = handleConditions(string);

    // Spell heightening handling
    string = string.replaceAll("Heightened (", "<hr />Heightened (");
    string = string.replaceAll(/Heightened \(\+(\d+)\)/g, "</p><p><strong>Heightened (+$1)</strong>");
    string = string.replaceAll(/Heightened \((\d+)(\w+)\)/g, "</p><p><strong>Heightened ($1$2)</strong>");
    string = string.replaceAll("<hr/></p><p><strong>Heightened", "</p><hr/><p><strong>Heightened");

    // Removing bullet points, should replace with the actual bullet points.
    string = string.replaceAll("•", "<ul><li>");
    string = string.replaceAll("•", "</li><li>");

    // Add template buttons
    string = string.replaceAll(/(\d+)-foot (emanation|burst|cone|line)/g, "@Template[type:$2|distance:$1]");

    // string = handle_actions(string)
    // string = handle_conditions(string)
    // string = handle_equipment(string)
    // string = handle_feats(string)
    // string = handle_spells(string)
    // string = handle_activation_actions(string)

    return string;
}

function handleInlineChecks(string: string): string {
    // Basic saves
    string = string.replaceAll(/DC (\d+) basic (\w+) save/gi, "@Check[type:$2|dc:$1|basic:true]");
    string = string.replaceAll(/basic (\w+) save DC (\d+)/gi, "@Check[type:$1|dc:$2|basic:true]");
    string = string.replaceAll(/basic (\w+) DC (\d+)/gi, "@Check[type:$1|dc:$2|basic:true]");

    // Regular saves
    string = string.replaceAll(/DC (\d+) (Reflex|Will|Fortitude)/gi, "@Check[type:$2|dc:$1]");
    string = string.replaceAll(/(Reflex|Will|Fortitude) DC (\d+)/gi, "@Check[type:$1|dc:$2]");
    string = string.replaceAll(/(Reflex|Will|Fortitude) \(DC (\d+)\)/gi, "@Check[type:$1|dc:$2]");
    string = string.replaceAll(/(Reflex|Will|Fortitude) save \(DC (\d+)\)/gi, "@Check[type:$1|dc:$2]");

    // Skills
    const skills = Object.values(CONFIG.PF2E.skills)
        .map((s) => game.i18n.localize(s.label))
        .join("|");
    string = string.replaceAll(/DC (\d+) (\w+)/gi, "@Check[type:$2|dc:$1]");
    string = string.replaceAll(new RegExp(String.raw`/(${skills}) DC (\d+)`, "gi"), "@Check[type:$1|dc:$2]");
    string = string.replaceAll(new RegExp(String.raw`/(${skills}) \(DC (\d+)\)`, "gi"), "@Check[type:$1|dc:$2]");

    // lore, uncaught saves
    string = string.replaceAll(/(\w+) Lore DC (\d+)/gi, "@Check[type:$2|dc:$1]");
    string = string.replaceAll(/DC (\d+) (\w+) save/gi, "@Check[type:$2|dc:$1]");
    string = string.replaceAll(/DC (\d+) flat check/gi, "@Check[type:flat|dc:$1]");

    // Catch capitalized saves and skills
    string = string.replaceAll(/@Check\[type:(\w+)\|/g, (_, match) => `@Check[type:${match.toLowerCase()}|`);

    return string;
}

function handleDamageRolls(string: string) {
    string = string.replaceAll(/ (\d)d(\d) (rounds|minutes|hours|days)/g, " [[/r $1d$2 #$3]]{$1d$2 $3}");
    string = string.replaceAll(/(\d+)d(\d+) (\w*) damage/g, "[[/r $1d$2[$3]]]");
    string = string.replaceAll(/([\dd(\s*+\s*))]+) (\w*) damage/g, "[[/r ($1)[$2]]]");
    string = string.replaceAll(/(\d+)d(\d+) persistent (\w*) damage/g, `[[/r ($1d$2)[persistent,$3]]]`);
    string = string.replaceAll(/(\d+)d(\d+) (\w+)(,|\.)/g, "[[/r $1d$2 #$3]]{$1d$2 $3}$4");
    string = string.replaceAll(/(\d+)d(\d+)\./g, "[[/r $1d$2]]{$1d$2}.");
    string = string.replaceAll(/(\s*)(\d+) (\w*) damage/g, "$1[[/r ($2)[$3]]]");
    return string;
}

function handleConditions(string: string) {
    const conditions = Object.values(CONFIG.PF2E.conditionTypes)
        .map((c) => game.i18n.localize(c))
        .join("|");
    return string.replaceAll(new RegExp(String.raw`(${conditions})( \d(?=[^\w\d]))?`, "gi"), (match, name, value) => {
        const condition = game.pf2e.ConditionManager.getCondition(sluggify(name));
        if (!condition) return match;

        return `@UUID[${condition.sourceId}]{${condition.name}${value ?? ""}}`;
    });
}
