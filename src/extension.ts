import { commands, ExtensionContext, window, workspace, Uri }
  from "vscode";
import { NotePanel } from "./panels/NotePanel";

import type { Reactive, Monadic } from "./utilities/reactive_monad";
import { R, monadic } from "./utilities/reactive_monad";

export function activate(context: ExtensionContext) {

  console.log("!!!!!markdownnote Activated!!!!!");

  const fileNameR = NotePanel.rFile();
  const modeR = NotePanel.rMode();

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

    modeR.next(mode);

  };

  const f1 = f(1);
  const f2 = f(2);
  const overlayCommand =
    commands.registerCommand("markdownnote.overlay", f1);
  const toSideCommand =
    commands.registerCommand("markdownnote.toSide", f2);

  const doNothingCommand =
    commands.registerCommand("markdownnote.doNothing",
      () => { console.log("..."); });

  // Add command to the extension context
  context.subscriptions.push(overlayCommand);
  context.subscriptions.push(toSideCommand);

  context.subscriptions.push(doNothingCommand);

  const overlay =
    workspace.getConfiguration("markdownnote.start_overlay");

  console.log("%%%%% start_overlay ? %%%%%");
  console.log(overlay["true/false"]);
  console.log("---------------");

  overlay["true/false"]
    ? f1()  // single mode
    : f2(); // open to the side



}
