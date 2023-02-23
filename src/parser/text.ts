export function parseDescription(text: string) {
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
        .replaceAll(/(Requirements|Requirement)/, "<p><strong>Requirements</strong>")
        .replaceAll(" Craft </p><p><strong>Requirements</strong>", "</p><hr /><p><strong>Craft Requirements</strong>")
        .replaceAll(/Activate \?/, "</p><p><strong>Activate</strong> <span class='pf2-icon'>1</span>")
        .replaceAll(/Stage (\d)/, "</p><p><strong>Stage $1</strong>");

    string = string.replaceAll(" </p>", "</p>");

    string = handleInlineChecks(string);

    // Damage rolls
    string = handleDamageRolls(string);

    // Spell heightening handling
    string = string.replace("Heightened (", "<hr />Heightened (");
    string = string.replace(/Heightened \(\+(\d+)\)/, "</p><p><strong>Heightened (+$1)</strong>");
    string = string.replace(/Heightened \((\d+)(\w+)\)/, "</p><p><strong>Heightened ($1$2)</strong>");
    string = string.replaceAll("<hr/></p><p><strong>Heightened", "</p><hr/><p><strong>Heightened");

    // Removing bullet points, should replace with the actual bullet points.
    string = string.replace("•", "<ul><li>");
    string = string.replaceAll("•", "</li><li>");

    // Add template buttons
    string = string.replace(/(\d+)-foot (emanation|burst|cone|line)/, "@Template[type:$2|distance:$1]");

    // string = handle_actions(string)
    // string = handle_conditions(string)
    // string = handle_equipment(string)
    // string = handle_feats(string)
    // string = handle_spells(string)
    // string = handle_activation_actions(string)

    return string;
}

function handleInlineChecks(string: string) {
    // Skills and saves
    string = string.replace(/DC (\d+) basic (\w+) save/, "@Check[type:$2|dc:$1|basic:true]");
    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/(Reflex|Will|Fortitude) DC (\d+)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) save \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");

    string = string.replace(/DC (\d+) (Reflex|Will|Fortitude)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/(\w+) DC (\d+)/, "@Check[type:$1|dc:$2]");
    string = string.replace(/(Reflex|Will|Fortitude) \(DC (\d+)\)/, "@Check[type:$1|dc:$2]");

    string = string.replace(/(\w+) Lore DC (\d+)/, "@Check[type:$2|dc:$1]");
    string = string.replace(/DC (\d+) (\w+) save/, "@Check[type:$2|dc:$1]");
    string = string.replace(/DC (\d+) flat check/, "@Check[type:flat|dc:$1]");

    // Catch capitalized saves and skills
    string = string.replace(/@Check\[type:(\w+)\|/, (_, match) => `@Check[type:${match.toLowerCase()}|`);

    return string;
}

function handleDamageRolls(string: string) {
    string = string.replace(/ (\d)d(\d) (rounds|minutes|hours|days)/, " [[/r $1d$2 #$3]]{$1d$2 $3}");
    string = string.replace(/(\s*)(\d+) (\w*) damage/, "$1[[/r ($2)[$3]]]");
    string = string.replace(/(\d+)d(\d+)\+(\d+) (\w*) damage/, "[[/r ($1d$2 + $3)[$4]]]");
    string = string.replace(/(\d+)d(\d+) persistent (\w*) damage/, `[[/r ($1d$2)[persistent,$3]]]`);
    string = string.replace(/(\d+)d(\d+) (\w*) damage/, "[[/r ($1d$2)[$3]]]");
    string = string.replace(/(\d+)d(\d+) (\w+)(,|\.)/, "[[/r $1d$2 #$3]]{$1d$2 $3}$4");
    string = string.replace(/(\d+)d(\d+)\./, "[[/r $1d$2]]{$1d$2}.");
    return string;
}
