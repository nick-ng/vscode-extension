const vscode = require("vscode");

const {
	toggleUseIgnoreFile,
} = require("./commands/toggle-use-ignore-files.cjs");

const commands = {
	"extension.nickToggleUseIgnoreFiles": toggleUseIgnoreFile,
};

function activate(context) {
	Object.entries(commands).forEach(([label, command]) => {
		context.subscriptions.push(vscode.commands.registerCommand(label, command));
	});
}

module.exports = {
	activate,
};
