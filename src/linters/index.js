const LintJs = require("./lint-js");
const LintMdJs = require("./lint-md-js");
const LintStyle = require("./lint-style");

const linters = {
	// Linters
	lint_js: LintJs,
	lint_md_js: LintMdJs,
	lint_style: LintStyle,
};

module.exports = linters;
