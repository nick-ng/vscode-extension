const vscode = require("vscode");
const iconTheme = require("../../../icons/nick-icon-theme.json");

const formatBookmarks = (bookmarks, context) => {
	const bookmarksByFilename = {};

	Object.values(bookmarks).forEach((bookmark) => {
		const { filePath } = bookmark;
		const pathFragments = filePath.split("/");

		const filename = pathFragments[pathFragments.length - 1];

		if (!bookmarksByFilename[filename]) {
			bookmarksByFilename[filename] = [];
		}

		bookmarksByFilename[filename].push({ pathFragments, ...bookmark });
	});

	const bookmarkLabels = {};

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
					const thisFragment = pathFragments.slice(-1 - j).join("/");
					const otherFragment = otherFragments.slice(-1 - j).join("/");

					if (thisFragment !== otherFragment) {
						fewestFragments = Math.max(fewestFragments, j);
						break;
					}
				}
			}

			const filenameFragments = filename.split(".");

			bookmarkLabels[id] = {
				id: `${id}:`,
				img: `${context.extensionPath.replace("\\", "/")}/icons/nick_001.png`,
				filename: context.extensionPath,
				path:
					fewestFragments === 0
						? ""
						: ["…", ...pathFragments.slice(-1 - fewestFragments)].join("/"),
			};
		});
	});

	return bookmarkLabels;
};

module.exports = {
	formatBookmarks,
};
