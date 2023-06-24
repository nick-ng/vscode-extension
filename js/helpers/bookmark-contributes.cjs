const SET_BASE = "extension.nickSetBookmark";
const GOTO_BASE = "extension.nickGoToBookmark";

const setCommands = [];
const goToCommands = [];

for (let i = 0; i < 10; i++) {
	const commandSet = `${SET_BASE}${i}`;
	const commandGoTo = `${GOTO_BASE}${i}`;

	setCommands.push({
		command: commandSet,
		title: `Nick: Set Bookmark ${i}`,
	});

	goToCommands.push({
		command: commandGoTo,
		title: `Nick: Go To Bookmark ${i}`,
	});
}

console.info(JSON.stringify([...setCommands, ...goToCommands], null, " "));
