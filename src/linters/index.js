const LintJs = require("./lint-js");
const LintStyle = require("./lint-style");

const linters = {
	// Linters
	lint_js: LintJs,
	lint_style: LintStyle,
};

module.exports = linters;
