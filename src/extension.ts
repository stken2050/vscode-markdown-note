import { commands, ExtensionContext, window, workspace }
  from "vscode";
import { NotePanel } from "./panels/NotePanel";

export function activate(context: ExtensionContext) {

  console.log("!!!!!markdownnote Activated!!!!!");

  const f1 = () => NotePanel.render(context.extensionUri, 1);
  const f2 = () => NotePanel.render(context.extensionUri, 2);

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
