/// <reference types="jquery" />
/// <reference types="tooltipster" />
import type * as TinyMCE from "tinymce";
import "../../../styles/tinymce.scss";
export declare class JournalSheetPF2e<TJournalEntry extends JournalEntry = JournalEntry> extends JournalSheet<TJournalEntry> {
    get template(): string;
    activateListeners($html: JQuery): void;
    activateEditor(name: string, options?: Partial<TinyMCE.EditorSettings>, initialContent?: string): void;
}
