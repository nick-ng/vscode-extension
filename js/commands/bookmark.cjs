// https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing
const vscode = require("vscode");
const { formatBookmarks } = require("./utils/bookmark-utils.cjs");

const SET_BASE = "extension.nickSetBookmark";
const GOTO_BASE = "extension.nickGoToBookmark";
const SWITCH_VIEW_COLUMN_SETTING = "nick.bookmarks.switchViewColumn";

const bookmarks = {};

const viewName = "nick.BookmarksView";

const htmlForWebview = `
<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title></title>
	</head>
	<body>
		${new Array(10)
			.fill(0)
			.map((_, i) =>
				[
					"<div>",
					`<span id=b${i}-id></span>`,
					`<img style="margin-left: 3px; margin-right: 3px;" id=b${i}-img />`,
					`<span id=b${i}-filename></span>`,
					`<span style="margin-left: 6px; color: #888;" id=b${i}-path></span>`,
					"</div>",
				].join("")
			)
			.join("")}
	</body>
	<script>
		window.addEventListener("message", (event) => {
			const message = event.data;

			for (let i = 0; i < 10; i++) {
				const elId = document.getElementById("b" + i + "-id");
				const elFilename = document.getElementById("b" + i + "-id");

				["id", "img", "filename", "path"].forEach((key) => {
					const el = document.getElementById("b" + i + "-" + key);

					const value = message[i] ? message[i][key] : "";

					if (key === "img") {
						el.setAttribute("src", value);
					} else {
						el.textContent = value;
					}
				})
			}
		})

		acquireVsCodeApi().postMessage({});
	</script>
</html>`;

let myPanel;

const viewProvider = (context) => ({
	resolveWebviewView: (panel, _context, _token) => {
		myPanel = panel;

		panel.webview.options = {
			enableScripts: true,
		};

		panel.webview.html = htmlForWebview;

		panel.webview.onDidReceiveMessage(() => {
			panel.webview.postMessage(formatBookmarks(bookmarks, context));
		});
	},
});

const makeSetBookmark = (i, context) => () => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor.selection;

	const lineNumber = selection?.start?.line || 0;
	const columnNumber = selection?.start?.character || 0;

	bookmarks[i] = {
		id: i,

		viewColumn: editor.viewColumn,
		lineNumber,
		columnNumber,
		filePath: editor.document.uri.path,
	};

	if (myPanel) {
		myPanel.show(true);
		myPanel.webview.postMessage(formatBookmarks(bookmarks, context));
	}
};

const makeGoToBookmark = (i) => () => {
	if (bookmarks[i]) {
		const { viewColumn, lineNumber, columnNumber, filePath } = bookmarks[i];

		const all = vscode.workspace.getConfiguration();

		const mine = vscode.workspace.getConfiguration(SWITCH_VIEW_COLUMN_SETTING);

		vscode.window.showInformationMessage(
			`all: ${all.nick.bookmarks.switchViewColumn}
mine: ${mine}`
		);

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
			// @todo(nick-ng): use cursor move to move cursor
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
			vscode.commands.registerCommand(commandSet, makeSetBookmark(i, context))
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(commandGoTo, makeGoToBookmark(i))
		);
	}

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(viewName, viewProvider(context), {
			webviewOptions: {
				localResourceRoots: [`${context.extensionPath}\\icons`],
			},
		})
	);
};

module.exports = {
	bookmarkMaker,
};
