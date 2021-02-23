module.exports = {
	"basic:import-css": {
		message: 'supports { importFrom: "test/import-properties{-2}?.css" } usage',
		options: {
			importFrom: [
				"test/import-properties.css",
				"test/import-properties-2.css",
			],
			exportDir: "test/",
		},
		expect: "basic.import.expect.css",
		result: "basic.import.result.css",
	},
};
