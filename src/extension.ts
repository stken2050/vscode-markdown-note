import { commands, ExtensionContext, window, workspace, Uri }
  from "vscode";
import { NotePanel } from "./panels/NotePanel";

import type { Reactive, Monadic } from "./utilities/reactive_monad";
import { R, monadic } from "./utilities/reactive_monad";

export function activate(context: ExtensionContext) {

  console.log("!!!!!markdownnote Activated!!!!!");

  const fileNameR = NotePanel.r();

  fileNameR
    .map(fileName => {
      console.log("$$$$$extension.ts$$$$$$$");
      console.log(fileName);
      console.log("############");
    });

  const f = (mode: number) => () => {
    const fileName =
      window.activeTextEditor?.document.uri
        .toString()
        .split("file://")[1];

    !!fileName
      ? (() => {
        fileNameR.next(fileName);
        NotePanel
          .render(context.extensionUri, fileName, mode);
      })()
      : undefined;

  };

  const f1 = f(1);
  const f2 = f(2);
  const openNoteCommand =
    commands.registerCommand("markdownnote.openNote", f1);
  const sideNoteCommand =
    commands.registerCommand("markdownnote.sideNote", f2);

  // Add command to the extension context
  context.subscriptions.push(openNoteCommand);
  context.subscriptions.push(sideNoteCommand);

  const singleMode =
    workspace.getConfiguration("markdownnote.single_mode");

  console.log("====singleMode ?");
  console.log(singleMode["true/false"]);
  console.log("---------------");

  singleMode["true/false"]
    ? f1()  // single mode
    : f2(); // open to the side



}
