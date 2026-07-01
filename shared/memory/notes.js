"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTES_TITLE = exports.NOTES_ID_MARKER = exports.NOTES_SCOPE = void 0;
exports.loadNotes = loadNotes;
exports.appendNote = appendNote;
exports.NOTES_SCOPE = 'global';
exports.NOTES_ID_MARKER = 'user-notes';
exports.NOTES_TITLE = `User notes (${exports.NOTES_ID_MARKER})`;
function findNotesMemory(store) {
    const results = store.searchMemories(exports.NOTES_ID_MARKER, {
        type: 'note',
        scope: exports.NOTES_SCOPE,
        limit: 1,
    });
    return results[0]?.memory ?? null;
}
function loadNotes(store) {
    return findNotesMemory(store)?.content ?? '';
}
function appendNote(store, note) {
    const existing = findNotesMemory(store);
    const timestamp = new Date().toISOString();
    if (existing) {
        const updated = `${existing.content}\n[${timestamp}] ${note}`;
        store.updateMemory(existing.id, { content: updated });
    }
    else {
        store.addMemory({
            type: 'note',
            scope: exports.NOTES_SCOPE,
            title: exports.NOTES_TITLE,
            content: `[${timestamp}] ${note}`,
        });
    }
}
