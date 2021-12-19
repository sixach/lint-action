const ESLint = require("./eslint");
const PHPCodeSniffer = require("./php-codesniffer");
const Prettier = require("./prettier");
const Stylelint = require("./stylelint");

const linters = {
	// Linters
	eslint: ESLint,
	php_codesniffer: PHPCodeSniffer,
	stylelint: Stylelint,

	// Formatters (should be run after linters)
	prettier: Prettier,
};

module.exports = linters;
