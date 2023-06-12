const vscode = require("vscode");

module.exports = {
	toggleUseIgnoreFile: async () => {
		vscode.commands.executeCommand("workbench.action.closeQuickOpen");
		const all = vscode.workspace.getConfiguration();

		const existingSetting = all.search.useIgnoreFiles;

		await vscode.workspace
			.getConfiguration()
			.update(
				"search.useIgnoreFiles",
				!existingSetting,
				vscode.ConfigurationTarget.Global
			);

		vscode.commands.executeCommand("notifications.clearAll");

		if (!existingSetting) {
			vscode.window.showInformationMessage("Searching non-ignored files");
		} else {
			vscode.window.showInformationMessage("Searching all files");
		}

		vscode.commands.executeCommand("workbench.action.quickOpen");
	},
};
