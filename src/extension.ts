import { commands, ExtensionContext, Uri, window, workspace }
  from "vscode";
import { NotePanel } from "./panels/NotePanel";

export function activate(context: ExtensionContext) {

  console.log("!!!!!markdownnote Activated!!!!!");

  const f = (mode: number) =>
    () => {
      const fileName =
        window.activeTextEditor?.document.uri
          .toString()
          .split("file://")[1];

      !!fileName
        ? NotePanel.render(context.extensionUri, fileName, mode)
        : undefined;
    };

  const openNoteCommand =
    commands.registerCommand("markdownnote.openNote", f(1));
  const sideNoteCommand =
    commands.registerCommand("markdownnote.sideNote", f(2));

  // Add command to the extension context
  context.subscriptions.push(openNoteCommand);
  context.subscriptions.push(sideNoteCommand);

  const singleMode =
    workspace.getConfiguration("markdownnote.single_mode");

  console.log("====singleMode ?");
  console.log(singleMode["true/false"]);
  console.log("---------------");

  singleMode["true/false"]
    ? f(1)()  // single mode
    : f(2)(); // open to the side


}
