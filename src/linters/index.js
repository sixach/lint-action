const Format = require("./format");
const LintJs = require("./lint-js");
const LintMdJs = require("./lint-md-js");
const LintStyle = require("./lint-style");

const linters = {
	// Format
	format: Format,
	// Linters
	lint_js: LintJs,
	lint_md_js: LintMdJs,
	lint_style: LintStyle,
};

module.exports = linters;
