// https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing
const vscode = require("vscode");

const SET_BASE = "extension.nickSetBookmark";
const GOTO_BASE = "extension.nickGoToBookmark";

const bookmarks = {};

const viewName = "nick.BookmarksView";

const htmlForWebview = `
<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>asdf</title>
	</head>
	<body>
		<div id="b0"></div>
		<div id="b1"></div>
		<div id="b2"></div>
		<div id="b3"></div>
		<div id="b4"></div>
		<div id="b5"></div>
		<div id="b6"></div>
		<div id="b7"></div>
		<div id="b8"></div>
		<div id="b9"></div>
	</body>
	<script>

		window.addEventListener("message", (event) => {
			const message = event.data;

			for (let i = 0; i < 10; i++) {
				const el = document.getElementById("b" + i);

				if (message[i]?.label) {
					el.textContent = message[i].label;
				} else {
					el.textContent = "";
				}
			}
		})

		acquireVsCodeApi().postMessage({});
	</script>
</html>`;

let myPanel;

const viewProvider = {
	resolveWebviewView: (panel, _context, _token) => {
		myPanel = panel;

		panel.webview.options = {
			enableScripts: true,
		};

		panel.webview.html = htmlForWebview;

		panel.webview.onDidReceiveMessage(() => {
			panel.webview.postMessage(bookmarks);
		});
	},
};

const makeSetBookmark = (i) => () => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor.selection;

	const pathFragments = editor.document.uri.path.split("/");

	const lineNumber = selection?.start?.line || 0;
	const columnNumber = selection?.start?.character || 0;
	const filename = pathFragments[pathFragments.length - 1];

	// @todo(nick-ng): get "current" directory
	const label = `${i}: ${filename}:${lineNumber + 1}:${columnNumber + 1}`;

	bookmarks[i] = {
		label,
		viewColumn: editor.viewColumn,
		lineNumber,
		columnNumber,
		filePath: editor.document.uri.path,
	};

	if (myPanel) {
		myPanel.show(true);
		myPanel.webview.postMessage(bookmarks);
	}
};

const makeGoToBookmark = (i) => () => {
	if (bookmarks[i]) {
		const { viewColumn, lineNumber, columnNumber, filePath } = bookmarks[i];

		switch (viewColumn) {
			case 1: {
				vscode.commands.executeCommand(
					"workbench.action.focusFirstEditorGroup"
				);
				break;
			}
			case 2: {
				vscode.commands.executeCommand(
					"workbench.action.focusSecondEditorGroup"
				);
				break;
			}
		}

		vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filePath));

		const cursorPosition = new vscode.Position(lineNumber, columnNumber);

		// @todo(nick-ng): figure out a better way to wait for the editor
		setTimeout(() => {
			vscode.window.activeTextEditor.selections = [
				new vscode.Selection(cursorPosition, cursorPosition),
			];
		}, 100);
	}
};

const bookmarkMaker = (context) => {
	for (let i = 0; i < 10; i++) {
		const commandSet = `${SET_BASE}${i}`;
		const commandGoTo = `${GOTO_BASE}${i}`;

		context.subscriptions.push(
			vscode.commands.registerCommand(commandSet, makeSetBookmark(i))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(commandGoTo, makeGoToBookmark(i))
		);
	}

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(viewName, viewProvider)
	);
};

module.exports = {
	bookmarkMaker,
};
