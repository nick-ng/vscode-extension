// https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing
const vscode = require("vscode");
const { formatBookmarks } = require("./utils/bookmark-utils.cjs");

const SET_BASE = "extension.nickSetBookmark";
const GOTO_BASE = "extension.nickGoToBookmark";

const bookmarks = {};

const viewName = "nick.BookmarksView";

const htmlForWebview = `
<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title></title>
		<style>
			.main {
				overflowy: hidden;
			}

			.bookmark {
				display: flex;
				flex-direction: row;
				flex-wrap: nowrap;
				align-items: center;
			}

			.buffer {
				margin-bottom: 5px;
			}
		</style>
	</head>
	<body>
		<div class="main">
			${new Array(10)
				.fill(0)
				.map((_, i) =>
					[
						`<div id="b${i}-container" class="bookmark">`,
						`<span id="b${i}-id"></span>`,
						`<img style="margin-left: 5px; margin-right: 5px; height: 16px;" id="b${i}-img" />`,
						`<span id="b${i}-filename"></span>`,
						`<span style="margin-left: 5px; color: #888;" id="b${i}-path"></span>`,
						"</div>",
					].join("")
				)
				.join("")}
		</div>
	</body>
	<script>
		window.addEventListener("message", (event) => {
			const message = event.data;

			const containerEl = document.getElementById("b0-container");
			if (message[0].idNumber === 0) {
				containerEl.classList.add("buffer");
			} else {
				containerEl.classList.remove("buffer");
			}

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

const getBookmark = () => {
	const editor = vscode.window.activeTextEditor;
	const selection = editor.selection;

	const lineNumber = selection?.active?.line || 0;
	const columnNumber = selection?.active?.character || 0;

	const filePath = editor.document.uri.path;

	const viewColumn = editor.viewColumn;

	return {
		viewColumn,
		lineNumber,
		columnNumber,
		filePath,
		hash: [filePath, lineNumber, columnNumber].join(":"),
		viewColumnHash: [viewColumn, filePath, lineNumber, columnNumber].join(":"),
	};
};

const makeSetBookmark = (i, context) => () => {
	bookmarks[i] = {
		...getBookmark(),
		id: i,
	};

	if (myPanel) {
		myPanel.show(true);
		myPanel.webview.postMessage(formatBookmarks(bookmarks, context));
	}
};

const centreHack = async (callback) => {
	const all1 = vscode.workspace.getConfiguration();

	const previousSetting = all1.editor.cursorSurroundingLines;

	await vscode.workspace
		.getConfiguration()
		.update(
			"editor.cursorSurroundingLines",
			20,
			vscode.ConfigurationTarget.Global
		);

	callback();

	await vscode.workspace
		.getConfiguration()
		.update(
			"editor.cursorSurroundingLines",
			previousSetting,
			vscode.ConfigurationTarget.Global
		);
};

const getSwitchViewColumnSetting = () => {
	const all = vscode.workspace.getConfiguration();

	return all.nick.bookmarks.switchViewColumn;
};

const goToBookmark = ({ viewColumn, lineNumber, columnNumber, filePath }) => {
	if (getSwitchViewColumnSetting()) {
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
	}

	vscode.commands.executeCommand("workbench.view.explorer");

	vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filePath));

	const cursorPosition = new vscode.Position(lineNumber, columnNumber);

	const editor = vscode.window.activeTextEditor;
	const selection = editor.selection;

	// @todo(nick-ng): figure out a better way to wait for the editor
	setTimeout(async () => {
		const currentLineNumber = selection?.active?.line || 0;
		const lineDifference = currentLineNumber - lineNumber;

		if (lineDifference !== 0) {
			vscode.commands.executeCommand("cursorMove", {
				to: "down",
				by: "line",
				value: -lineDifference,
			});
		}

		vscode.window.activeTextEditor.selections = [
			new vscode.Selection(cursorPosition, cursorPosition),
		];
	}, 100);
};

const makeGoToBookmark = (i) => () => {
	if (bookmarks[i]) {
		const currentBookmark = getBookmark();

		if (getSwitchViewColumnSetting()) {
			if (bookmarks[i].viewColumnHash === currentBookmark.viewColumnHash) {
				return;
			}
		} else {
			if (bookmarks[i].hash === currentBookmark.hash) {
				return;
			}
		}

		if (i === 0) {
			const originalBookmark = { ...bookmarks[i] };

			vscode.commands.executeCommand("extension.nickSetBookmark0");

			goToBookmark(originalBookmark);
		} else {
			vscode.commands.executeCommand("extension.nickSetBookmark0");

			goToBookmark(bookmarks[i]);
		}
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

	context.subscriptions.push(
		vscode.commands.registerCommand("extension.nickQuickOpen", () => {
			vscode.commands.executeCommand("extension.nickSetBookmark0");
			vscode.commands.executeCommand("workbench.action.quickOpen");
		})
	);
};

module.exports = {
	bookmarkMaker,
};
