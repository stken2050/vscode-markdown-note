import { commands, ExtensionContext } from "vscode";
import { NotePanel } from "./panels/NotePanel";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  NotePanel.render(context.extensionUri);

  const showNoteCommand =
    commands.registerCommand("markdownnote.showNote", () => {
      NotePanel.render(context.extensionUri);
    });

  // Add command to the extension context
  context.subscriptions.push(showNoteCommand);
}
