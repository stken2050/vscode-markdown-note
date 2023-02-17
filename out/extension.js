"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const NotePanel_1 = require("./panels/NotePanel");
function activate(context) {
    // Create the show hello world command
    NotePanel_1.NotePanel.render(context.extensionUri);
    const showNoteCommand = vscode_1.commands.registerCommand("markdownnote.showNote", () => {
        NotePanel_1.NotePanel.render(context.extensionUri);
    });
    // Add command to the extension context
    context.subscriptions.push(showNoteCommand);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map