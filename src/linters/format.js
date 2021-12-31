const { run } = require("../utils/action");
const commandExists = require("../utils/command-exists");
const { initLintResult } = require("../utils/lint-result");
const { getNpmBinCommand } = require("../utils/npm/get-npm-bin-command");

/** @typedef {import('../utils/lint-result').LintResult} LintResult */

/**
 * It helps to enforce coding style guidelines for files (JavaScript, YAML) by formatting
 * source code in a consistent way.
 */
class WPScriptsFormat {
	static get name() {
		return "WP-Scripts Format";
	}

	/**
	 * Verifies that all required programs are installed. Throws an error if programs are missing
	 * @param {string} dir - Directory to run the linting program in
	 * @param {string} prefix - Prefix to the format command
	 */
	static async verifySetup(dir, prefix = "") {
		// Verify that NPM is installed (required to execute ESLint)
		if (!(await commandExists("npm"))) {
			throw new Error("NPM is not installed");
		}

		// Verify that WPScripts is installed
		const commandPrefix = prefix || getNpmBinCommand(dir);
		try {
      // Format doesn't have any flags, run lint-js instead
			run(`${commandPrefix} wp-scripts lint-js -v`, { dir });
		} catch (err) {
			throw new Error(err.message);
		}
	}

	/**
	 * Runs the lint command and returns the command output
	 * @param {string} dir - Directory to run the linter in
	 * @param {string} args - Additional arguments to pass to the linter
   * @param {boolean} fix - Dummy variable for compatibility
	 * @param {string} prefix - Prefix to the lint command
	 * @returns {{status: number, stdout: string, stderr: string}} - Output of the lint command
	 */
	static lint(dir, args = "", fix = false, prefix = "") {
		const commandPrefix = prefix || getNpmBinCommand(dir);
		return run(
			`${commandPrefix} wp-scripts format ${args}`,
			{
				dir,
				ignoreErrors: true,
			},
		);
	}

	/**
	 * Parses the output of the lint command. Determines the success of the lint process and the
	 * severity of the identified code style violations
	 * @param {string} dir - Directory in which the linter has been run
	 * @param {{status: number, stdout: string, stderr: string}} output - Output of the lint command
	 * @returns {LintResult} - Parsed lint result
	 */
	static parseOutput(dir, output) {
		const lintResult = initLintResult();
		lintResult.isSuccess = output.status === 0;

		return false
	}
}

module.exports = WPScriptsFormat;
