"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const NotePanel_1 = require("./panels/NotePanel");
function activate(context) {
    console.log("!!!!!markdownnote Activated!!!!!");
    const fileNameR = NotePanel_1.NotePanel.rFile();
    const modeR = NotePanel_1.NotePanel.rMode();
    const f = (mode) => () => {
        var _a;
        const fileName = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.toString().split("file://")[1];
        !!fileName
            ? (() => {
                fileNameR.next(fileName);
                NotePanel_1.NotePanel
                    .render(context.extensionUri, fileName, mode);
            })()
            : undefined;
        modeR.next(mode);
    };
    const f1 = f(1);
    const f2 = f(2);
    const overlayCommand = vscode_1.commands.registerCommand("markdownnote.overlay", f1);
    const toSideCommand = vscode_1.commands.registerCommand("markdownnote.toSide", f2);
    const doNothingCommand = vscode_1.commands.registerCommand("markdownnote.doNothing", () => { console.log("..."); });
    // Add command to the extension context
    context.subscriptions.push(overlayCommand);
    context.subscriptions.push(toSideCommand);
    context.subscriptions.push(doNothingCommand);
    const overlay = vscode_1.workspace.getConfiguration("markdownnote.start_overlay");
    console.log("%%%%% start_overlay ? %%%%%");
    console.log(overlay["true/false"]);
    console.log("---------------");
    overlay["true/false"]
        ? f1() // single mode
        : f2(); // open to the side
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map