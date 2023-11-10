const vscode = require("vscode");

const warningBackground = new vscode.ThemeColor(
	"statusBarItem.warningBackground"
);

const command = "extension.nickToggleUseIgnoreFiles";

const getUseIgnoreFilesState = () => {
	const all = vscode.workspace.getConfiguration();

	return all.search.useIgnoreFiles;
};

const myStatusBar = vscode.window.createStatusBarItem(
	vscode.StatusBarAlignment.Right,
	99999
);

const updateStatusBar = (state) => {
	if (state) {
		myStatusBar.text = "Use Ignore: Yes";
		myStatusBar.backgroundColor = null;
	} else {
		myStatusBar.text = "Use Ignore: No";
		myStatusBar.backgroundColor = warningBackground;
	}
};

const toggleUseIgnoreFileMaker = (context) => {
	updateStatusBar(getUseIgnoreFilesState());

	myStatusBar.show();
	myStatusBar.command = command;

	const setUseIgnore = async (nextSetting) => {
		await vscode.workspace
			.getConfiguration()
			.update(
				"search.useIgnoreFiles",
				nextSetting,
				vscode.ConfigurationTarget.Global
			);

		updateStatusBar(nextSetting);
	};

	let resetEnableUseIgnoreTimeout = null;

	const toggleUseIgnore = async () => {
		vscode.commands.executeCommand("workbench.action.closeQuickOpen");

		const nextSetting = !getUseIgnoreFilesState();

		await setUseIgnore(nextSetting);

		vscode.commands.executeCommand("extension.nickQuickOpen");

		if (typeof resetEnableUseIgnoreTimeout === "number") {
			clearTimeout(resetEnableUseIgnoreTimeout);
		}

		setTimeout(() => {
			setUseIgnore(!nextSetting);
		}, 5000);
	};

	context.subscriptions.push(
		vscode.commands.registerCommand(command, toggleUseIgnore)
	);
};

module.exports = {
	toggleUseIgnoreFileMaker,
};
