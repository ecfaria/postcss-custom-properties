import path from "path";
import getCustomPropertiesFromRoot from "./lib/get-custom-properties-from-root";
import getCustomPropertiesFromImports from "./lib/get-custom-properties-from-imports";
import transformProperties from "./lib/transform-properties";
import writeCustomPropertiesToExports from "./lib/write-custom-properties-to-exports";

const creator = (opts) => {
	// whether to preserve custom selectors and rules using them
	const preserve = "preserve" in Object(opts) ? Boolean(opts.preserve) : true;

	// sources to import custom selectors from
	const importFrom = [].concat(Object(opts).importFrom || []);

	// destinations to export custom selectors to
	const exportTo = [].concat(Object(opts).exportTo || []);

	// export equivalent JS file to dir
	const exportDir = "exportDir" in Object(opts) ? opts.exportDir : false;

	// promise any custom selectors are imported
	// const customPropertiesPromise = getCustomPropertiesFromImports(importFrom);

	const customPropertiesPromise = async (file) => {
		const parsedPropertiesObject = await getCustomPropertiesFromImports(file);
		return parsedPropertiesObject;
	};

	// synchronous transform
	const syncTransform = (root) => {
		const customProperties = getCustomPropertiesFromRoot(root, { preserve });

		transformProperties(root, customProperties, { preserve });
	};

	// asynchronous transform
	const asyncTransform = async (root) => {
		const allRules = customPropertiesPromise(importFrom);

		if (exportDir) {
			const getRulesByFile = importFrom.map(async (file) => {
				const rules = await customPropertiesPromise([file]);
				return {
					[file]: rules,
				};
			});

			const rulesByFile = await Promise.all(getRulesByFile);

			rulesByFile.forEach(async (file) => {
				const fileName =
					path.basename(Object.keys(file)[0], ".css") + ".xabra.js";
				const fileRules = Object.values(file)[0];
				const newFileName = path.resolve(exportDir, fileName);
				await writeCustomPropertiesToExports(fileRules, [newFileName]);
				console.log(newFileName, fileRules);
			});
		}

		const customProperties = Object.assign(
			{},
			getCustomPropertiesFromRoot(root, { preserve }),
			await allRules
		);

		await writeCustomPropertiesToExports(customProperties, exportTo);

		transformProperties(root, customProperties, { preserve });
	};

	// whether to return synchronous function if no asynchronous operations are requested
	const canReturnSyncFunction =
		importFrom.length === 0 && exportTo.length === 0;

	return {
		postcssPlugin: "postcss-custom-properties",
		Once: canReturnSyncFunction ? syncTransform : asyncTransform,
	};
};

creator.postcss = true;

export default creator;
