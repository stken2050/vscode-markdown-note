"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotePanel = void 0;
const vscode_1 = require("vscode");
const getUri_1 = require("../utilities/getUri");
const getNonce_1 = require("../utilities/getNonce");
const reactive_monad_1 = require("../utilities/reactive_monad");
const vscode = require("vscode");
const fs = require("node:fs/promises");
const filePathR = (0, reactive_monad_1.R)('');
const getFileName = () => { var _a, _b; return ((_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.fileName) || ""; };
const getExsitingFileName = () => (getFileName() !== "")
    ? filePathR.next(getFileName())
    : filePathR.next(filePathR.lastVal);
const reloadWebview = () => vscode.commands
    .executeCommand("workbench.action.webview.reloadWebviewAction");
const keybindsR = (0, reactive_monad_1.R)(vscode.workspace.getConfiguration('markdownnote.webkeybindings'));
const getConfig = () => keybindsR.next(vscode.workspace.getConfiguration('markdownnote.webkeybindings'));
/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
class NotePanel {
    /**
     * The NotePanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    constructor(panel, extensionUri) {
        this._disposables = [];
        getExsitingFileName();
        //------------------------------------
        //-----------------------------------
        this._panel = panel;
        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
        const reveal = () => this._panel.reveal(vscode_1.ViewColumn.Two);
        vscode_1.window.onDidChangeActiveTextEditor(() => {
            console.log("onDidChangeActiveTextEditor!!!!!");
            (getFileName() !== "")
                ? reloadWebview()
                : undefined;
        });
    }
    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    static render(extensionUri) {
        if (NotePanel.currentPanel) {
            // If the webview panel already exists reveal it
            // reloadWebview();
            NotePanel.currentPanel._panel.reveal(vscode_1.ViewColumn.Two);
        }
        else {
            // If a webview panel does not already exist create and show a new one
            const panel = vscode_1.window.createWebviewPanel(
            // Panel view type
            "showNote", 
            // Panel title
            "Markdown Notebook", 
            // The editor column the panel should be displayed in
            vscode_1.ViewColumn.Two, 
            // Extra panel configurations
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
                localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, "out"), vscode_1.Uri.joinPath(extensionUri, "webview-ui/build")],
            });
            NotePanel.currentPanel = new NotePanel(panel, extensionUri);
        }
    }
    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    dispose() {
        NotePanel.currentPanel = undefined;
        // Dispose of the current webview panel
        this._panel.dispose();
        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the SolidJS webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    _getWebviewContent(webview, extensionUri) {
        // The CSS file from the SolidJS build output
        const stylesUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        // The JS file from the SolidJS build output
        const scriptUri = (0, getUri_1.getUri)(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const nonce = (0, getNonce_1.getNonce)();
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Markdown Notebook Solid</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }
    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    _setWebviewMessageListener(webview) {
        keybindsR.map((keybinds) => webview.postMessage({
            cmd: 'keybinds',
            obj: keybinds
        }));
        vscode.workspace.onDidChangeConfiguration(getConfig);
        filePathR.map((filePath) => {
            console.log(filePathR.lastVal);
            fs.readFile(filePath, { encoding: "utf8" })
                .then(mdText => {
                webview.postMessage({
                    cmd: 'load',
                    obj: mdText
                });
            }).catch(err => {
                console.error(err);
            });
        });
        webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const text = message.text;
            switch (command) {
                case "hello":
                    // Code that should run in response to the hello message command
                    vscode_1.window.showInformationMessage(text);
                    return;
                case "requestLoad":
                    console.log('requestLoad!!!!!!!!!!!!!!!!!!!!!');
                    getExsitingFileName();
                    getConfig();
                    return;
                case "save":
                    const promise = fs.writeFile(filePathR.lastVal, text);
                    return;
            }
        }, undefined, this._disposables);
    }
}
exports.NotePanel = NotePanel;
//# sourceMappingURL=NotePanel.js.map