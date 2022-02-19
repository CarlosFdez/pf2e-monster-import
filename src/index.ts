import { MonsterImportApplication } from "./import-application";

// will be extracted by webpack
import "./styles/styles.scss";

Hooks.on("renderActorSheet", async (sheet: ActorSheet, $html: JQuery) => {
    const actor = sheet.actor;
    if (!game.user.isGM || !(actor instanceof CONFIG.PF2E.Actor.documentClasses.npc)) {
        return;
    }

    const title = game.i18n.localize("PF2E-MI.Import.Title");
    const label = game.i18n.localize("PF2E-MI.Import.Label");
    const $button = $(`<a class="pf2e-monster-import" title="${title}"><i class="fas fa-file-upload"></i>${label}</a>`);
    $button.on("click", () => {
        new MonsterImportApplication({ actor }).render(true);
    });

    $html.find("a.pf2e-monster-import").remove();
    $button.insertAfter($html.find(".window-title"));
});
