"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const NotePanel_1 = require("./panels/NotePanel");
const reactive_monad_1 = require("./utilities/reactive_monad");
const fs = require("node:fs/promises");
function activate(context) {
    var _a;
    console.log("!!!!!markdownnote Activated!!!!!");
    const fileNameR = (0, reactive_monad_1.R)('');
    const mdTextR = NotePanel_1.NotePanel.rMdText();
    const saveR = NotePanel_1.NotePanel.rSave();
    saveR.map(text => text !== undefined
        ? fs.writeFile(fileNameR.lastVal, text)
        : undefined);
    const overlay = vscode.workspace.getConfiguration("markdownnote.start_overlay");
    console.log("%%%%% start_overlay ? %%%%%");
    console.log(overlay["true/false"]);
    const modeR = (0, reactive_monad_1.R)(overlay["true/false"]
        ? 1
        : 2);
    const f = (document) => !!document && document.languageId === 'markdown'
        ? document.fileName !== fileNameR.lastVal
            ? (() => {
                console.log(document.fileName);
                fileNameR.lastVal = document.fileName;
                mdTextR.next(document.getText() // entire markdown text
                );
                modeR.lastVal === 1
                    ? vscode.commands
                        .executeCommand("markdownnote.overlay")
                    : vscode.commands
                        .executeCommand("markdownnote.toSide");
            })()
            : undefined
        : undefined;
    // a markdown document may be already opened in the activeTextEditor
    f((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document);
    // to trigger in side-mode, need to focus the first pane
    vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
    // a markdown document may be newly opened in the activeTextEditor
    vscode.window.onDidChangeActiveTextEditor((evt) => f(evt === null || evt === void 0 ? void 0 : evt.document));
    const doNothing = () => { console.log("..."); };
    const doNothingCommand = vscode.commands.registerCommand("markdownnote.doNothing", doNothing);
    const overlayCommand = vscode.commands.registerCommand("markdownnote.overlay", () => {
        modeR.next(1); // switch mode to 1
        NotePanel_1.NotePanel.render(context.extensionUri, 1);
    });
    const toSideCommand = vscode.commands.registerCommand("markdownnote.toSide", () => {
        modeR.next(2); // switch mode to 2
        NotePanel_1.NotePanel.render(context.extensionUri, 2);
    });
    // Add command to the extension context
    context.subscriptions.push(doNothingCommand);
    context.subscriptions.push(overlayCommand);
    context.subscriptions.push(toSideCommand);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map