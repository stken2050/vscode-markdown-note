import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

import type { Reactive, Monadic } from "../utilities/reactive_monad";
import { R, monadic } from "../utilities/reactive_monad";

import * as vscode from 'vscode';

import * as fs from "node:fs/promises";

const filePathR = R('');
const getFileName =
  () => vscode.window.activeTextEditor?.document?.fileName || "";

const getExsitingFileName =
  (fileName: string) =>
    (fileName !== "")
      ? filePathR.next(fileName)
      : filePathR.next(filePathR.lastVal);

const reloadWebview = () =>
  vscode.commands
    .executeCommand("workbench.action.webview.reloadWebviewAction");


const keybindsR =
  R(vscode.workspace.getConfiguration('markdownnote.webkeybindings'));

const getConfig: any = () =>
  keybindsR.next(
    vscode.workspace.getConfiguration('markdownnote.webkeybindings')
  );


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
export class NotePanel {

  public static currentPanel: NotePanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The NotePanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {

    getExsitingFileName(getFileName());
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

    const reveal = () => this._panel.reveal(ViewColumn.Two);

    window.onDidChangeActiveTextEditor(
      () => {
        console.log("onDidChangeActiveTextEditor!!!!!");

        (getFileName() !== "")
          ? reloadWebview()
          : undefined;
      }
    );

  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */

  public static render(extensionUri: Uri) {

    if (NotePanel.currentPanel) {
      // If the webview panel already exists reveal it
      reloadWebview();
      NotePanel.currentPanel._panel.reveal(ViewColumn.Two, true);

    } else {
      // If a webview panel does not already exist create and show a new one

      const panel = window.createWebviewPanel(
        // Panel view type
        "showNote",
        // Panel title
        "Markdown Note",
        // The editor column the panel should be displayed in
        ViewColumn.Two,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "webview-ui/build")],
        }
      );

      NotePanel.currentPanel = new NotePanel(panel, extensionUri);

    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
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
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the SolidJS build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the SolidJS build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Markdown Note</title>


          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css"
          integrity="sha384-vKruj+a13U8yHIkAyGgK1J3ArTLzrFGBbBc0tDp4ad/EyewESeXE/Iv67Aj8gKZ0" crossorigin="anonymous">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js"
          integrity="sha384-PwRUT/YqbnEjkZO0zZxNqcxACrXe+j766U2amXcgMg5457rve2Y7I6ZJSm2A0mS4"
          crossorigin="anonymous"></script>



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
  private _setWebviewMessageListener(webview: Webview) {

    keybindsR.map((keybinds) =>
      webview.postMessage({
        cmd: 'keybinds',
        obj: keybinds
      })
    );

    vscode.workspace.onDidChangeConfiguration(getConfig);


    filePathR.map((filePath: string) => {
      console.log("@@ filePathR.lastVal @@@@@@@@@@@");
      console.log(
        filePath
      );

      filePath === ""
        ? undefined
        : (() => {

          fs.readFile(filePath, { encoding: "utf8" })
            .then(mdText => {
              webview.postMessage({
                cmd: 'load',
                obj: mdText
              });
            }).catch(err => {
              console.error(err);
            });

        })();
    });

    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {

          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;

          case "requestLoad":
            console.log(
              'requestLoad!!!!!!!!!!!!!!!!!!!!!'
            );
            getExsitingFileName(getFileName());
            getConfig();
            return;

          case "save":
            const promise = fs.writeFile(filePathR.lastVal, text);
            return;

        }
      },
      undefined,
      this._disposables
    );
  }
}
