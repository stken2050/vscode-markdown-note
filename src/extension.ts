import { commands, ExtensionContext } from "vscode";
import { NotePanel } from "./panels/NotePanel";

export function activate(context: ExtensionContext) {
  // Create the show hello world command

  const f = () => NotePanel.render(context.extensionUri);

  const showNoteCommand =
    commands.registerCommand("markdownnote.showNote", f);

  // Add command to the extension context
  context.subscriptions.push(showNoteCommand);

  f();

 // setTimeout(f, 1000);

}
