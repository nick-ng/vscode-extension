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

const toggleUseIgnoreFileMaker = (_context) => {
	const startingSetting = getUseIgnoreFilesState();

	updateStatusBar(startingSetting);

	myStatusBar.show();
	myStatusBar.command = command;

	return {
		command,
		callback: async () => {
			vscode.commands.executeCommand("workbench.action.closeQuickOpen");

			const nextSetting = !getUseIgnoreFilesState();

			await vscode.workspace
				.getConfiguration()
				.update(
					"search.useIgnoreFiles",
					nextSetting,
					vscode.ConfigurationTarget.Global
				);

			updateStatusBar(nextSetting);
		},
	};
};

module.exports = {
	toggleUseIgnoreFileMaker,
};
