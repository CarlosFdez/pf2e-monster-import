import { NPCPF2e } from "@pf2e/module/actor";
import { MonsterParser } from "./parser";

interface MonsterImportOptions extends ApplicationOptions {
    actor: NPCPF2e;
}

export class MonsterImportApplication extends Application<MonsterImportOptions> {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "./modules/pf2e-monster-import/templates/import-form.html",
            class: "pf2e-monster-import-form",
            resizable: true,
            title: game.i18n.localize("PF2E-MI.Import.Title"),
            width: 550,
            height: 700,
            closeOnSubmit: true,
        });
    }

    override activateListeners($html: JQuery) {
        $html.find("[data-action=import]").on("click", async () => {
            const actor = this.options.actor;
            const input = $html.find("textarea").val().toString();
            const parser = new MonsterParser();
            const { updates, items, parsedSpells } = await parser.parse(input, actor);
            console.log(updates);
            await actor.update(updates);

            const existingItems = new Set(actor.items.map((item) => item.name));
            const newItems = items.filter((strike) => !existingItems.has(strike.name));
            console.log(items);
            console.log(newItems);
            await actor.createEmbeddedDocuments("Item", newItems);

            console.warn("FINAL SPELL ITEMS: ", parsedSpells);
            await actor.createEmbeddedDocuments("Item", parsedSpells, { keepId: true });
        });
    }
}
