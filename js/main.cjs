const vscode = require("vscode");

const {
	toggleUseIgnoreFileMaker,
} = require("./commands/toggle-use-ignore-files.cjs");

const commandMakers = [toggleUseIgnoreFileMaker];
const commands = {};

function activate(context) {
	commandMakers.forEach((commandMaker) => {
		const { command, callback } = commandMaker(context);

		context.subscriptions.push(
			vscode.commands.registerCommand(command, callback)
		);
	});

	Object.entries(commands).forEach(([command, callback]) => {
		context.subscriptions.push(
			vscode.commands.registerCommand(command, callback)
		);
	});
}

module.exports = {
	activate,
};
