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

				if (message[i]) {
					el.textContent = message[i];
				} else {
					el.textContent = "";
				}
			}
		})

		const vscode = acquireVsCodeApi();

		vscode.postMessage({})
	</script>
</html>
	`;

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
	vscode.window.showInformationMessage(`Set ${i}`);

	const bookmarkName = `test.js:2${i}`;
	bookmarks[i] = `${i}: ${bookmarkName}`;

	vscode.window.showInformationMessage(`Set ${i} ${JSON.stringify(myPanel)}`);

	if (myPanel) {
		myPanel.show(true);
		myPanel.webview.postMessage(bookmarks);
	}
};

const makeGoToBookmark = (i) => () => {
	vscode.window.showInformationMessage(`GoTo ${JSON.stringify(bookmarks[i])}`);
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
