"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const NotePanel_1 = require("./panels/NotePanel");
function activate(context) {
    console.log("!!!!!markdownnote Activated!!!!!");
    const fileNameR = NotePanel_1.NotePanel.r();
    fileNameR
        .map(fileName => {
        console.log("$$$$$extension.ts$$$$$$$");
        console.log(fileName);
        console.log("############");
    });
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
    };
    const f1 = f(1);
    const f2 = f(2);
    const openNoteCommand = vscode_1.commands.registerCommand("markdownnote.openNote", f1);
    const sideNoteCommand = vscode_1.commands.registerCommand("markdownnote.sideNote", f2);
    // Add command to the extension context
    context.subscriptions.push(openNoteCommand);
    context.subscriptions.push(sideNoteCommand);
    const singleMode = vscode_1.workspace.getConfiguration("markdownnote.single_mode");
    console.log("====singleMode ?");
    console.log(singleMode["true/false"]);
    console.log("---------------");
    singleMode["true/false"]
        ? f1() // single mode
        : f2(); // open to the side
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map