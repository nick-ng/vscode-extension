const vscode = require("vscode");

const {
	toggleUseIgnoreFileMaker,
} = require("./commands/toggle-use-ignore-files.cjs");
const { bookmarkMaker } = require("./commands/bookmark.cjs");

const commandMakers = [toggleUseIgnoreFileMaker, bookmarkMaker];
const commands = {};

function activate(context) {
	commandMakers.forEach((commandMaker) => {
		commandMaker(context);
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
