const vscode = require("vscode");
const fs = require("fs");
const iconTheme = require("../../../icons/nick-icon-theme.json");

const icons = {};

const getIconB64 = (context, filename) => {
	const { fileExtensions, file, fileNames, iconDefinitions } = iconTheme;

	let iconKey = file;

	if (fileNames[filename]) {
		const tempIcon = fileNames[filename] || file;

		iconKey = iconDefinitions[tempIcon];
	} else {
		const filenameFragments = filename.split(".");

		const fileExtension = filenameFragments[filenameFragments.length - 1];

		iconKey = fileExtensions[fileExtension] || file;
	}

	if (icons[iconKey]) {
		return icons[iconKey];
	}

	const iconPath = iconDefinitions[iconKey].iconPath;

	const fullIconPath = vscode.Uri.joinPath(
		context.extensionUri,
		"icons",
		iconPath
	).fsPath;

	icons[iconKey] = fs.readFileSync(fullIconPath, { encoding: "base64" });

	return icons[iconKey];
};

const formatBookmarks = (bookmarks, context) => {
	const rootPath =
		vscode.workspace.workspaceFolders.length === 1
			? vscode.workspace.workspaceFolders[0].uri.path
			: null;

	const bookmarksByFilename = {};

	Object.values(bookmarks).forEach((bookmark) => {
		const { filePath } = bookmark;
		const pathFragments = (rootPath ? filePath.replace(rootPath, "") : filePath)
			.split("/")
			.filter((a) => a);

		const filename = pathFragments[pathFragments.length - 1];

		if (!bookmarksByFilename[filename]) {
			bookmarksByFilename[filename] = [];
		}

		bookmarksByFilename[filename].push({ pathFragments, ...bookmark });
	});

	const bookmarkLabels = [];

	Object.entries(bookmarksByFilename).forEach(([filename, bookmarksB]) => {
		bookmarksB.forEach((bookmark) => {
			const { id, lineNumber, columnNumber, pathFragments } = bookmark;

			let fewestFragments = 0;
			// for every other bookmark
			for (let i = 0; i < bookmarksB.length; i++) {
				const { id: otherId, pathFragments: otherFragments } = bookmarksB[i];
				if (id === otherId) {
					// actually the same bookmark so continue
					continue;
				}

				const lowerFragmentCount = Math.min(
					otherFragments.length,
					pathFragments.length
				);

				for (let j = 1; j < lowerFragmentCount; j++) {
					const thisFragments = pathFragments.slice(-1 - j);
					const otherFragment = otherFragments.slice(-1 - j).join("/");

					if (thisFragments.join("/") !== otherFragment) {
						fewestFragments = Math.max(fewestFragments, j);
						break;
					}
				}
			}

			const thisFragments = pathFragments.slice(-1 - fewestFragments);

			let filePath = "";

			if (fewestFragments > 0) {
				filePath = thisFragments.slice(0, thisFragments.length - 1).join("/");

				if (thisFragments.length < pathFragments.length) {
					filePath = `…/${filePath}`;
				}
			}

			bookmarkLabels.push({
				id: `${id}:`,
				img: `data:image/png;base64,${getIconB64(context, filename)}`,
				filename: `${filename}:${lineNumber}:${columnNumber}`,
				path: filePath,
			});
		});
	});

	return bookmarkLabels;
};

module.exports = {
	formatBookmarks,
};
