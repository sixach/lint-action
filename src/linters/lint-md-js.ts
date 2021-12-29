import {LintResult, RunOutput} from '../types'
import commandExists from '../utils/command-exists'
import {getNpmBinCommand} from '../utils/npm/get-npm-bin-command'
import {initLintResult} from '../utils/lint-result'
import {removeTrailingPeriod} from '../utils/string'
import {run} from '../utils/action'

/** @typedef {import('../utils/lint-result').LintResult} LintResult */

/**
 * https://eslint.org
 */
const name = 'WP-Scripts Lint MD JS'

/**
 * Verifies that all required programs are installed. Throws an error if programs are missing
 * @param {string} dir - Directory to run the linting program in
 * @param {string} prefix - Prefix to the lint command
 */
async function verifySetup(dir: string, prefix = ''): Promise<void> {
  // Verify that NPM is installed (required to execute ESLint)
  if (!(await commandExists('npm'))) {
    throw new Error('NPM is not installed')
  }

  // Verify that WPScripts is installed
  const commandPrefix = prefix || getNpmBinCommand(dir)
  try {
    run(`${commandPrefix} wp-scripts lint-md-js -v`, {dir})
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message)
  }
}

/**
 * Runs the lint command and returns the command output
 * @param {string} dir - Directory to run the linter in
 * @param {string[]} extensions - File extensions which should be linted
 * @param {string} args - Additional arguments to pass to the linter
 * @param {boolean} fix - Whether the linter should attempt to fix code style issues automatically
 * @param {string} prefix - Prefix to the lint command
 * @returns {{status: number, stdout: string, stderr: string}} - Output of the lint command
 */
function lint(
  dir: string,
  extensions: string[],
  args = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fix = false,
  prefix = ''
): RunOutput {
  const extensionsArg = extensions.map((ext: string) => `.${ext}`).join(',')
  const commandPrefix = prefix || getNpmBinCommand(dir)
  return run(
    `${commandPrefix} wp-scripts lint-md-js --ext ${extensionsArg} --no-color --format json ${args} "."`,
    {
      dir,
      ignoreErrors: true
    }
  )
}

/**
 * Parses the output of the lint command. Determines the success of the lint process and the
 * severity of the identified code style violations
 * @param {string} dir - Directory in which the linter has been run
 * @param {{status: number, stdout: string, stderr: string}} output - Output of the lint command
 * @returns {LintResult} - Parsed lint result
 */
function parseOutput(dir: string, output: RunOutput): LintResult {
  const lintResult = initLintResult()
  lintResult.isSuccess = output.status === 0

  let outputJson
  try {
    outputJson = JSON.parse(output.stdout)
  } catch (err) {
    if (err instanceof Error) {
      throw Error(
        `Error parsing ${name} JSON output: ${err.message}. Output: "${output.stdout}"`
      )
    }
  }

  for (const violation of outputJson) {
    const {filePath, messages} = violation
    const path = filePath.substring(dir.length + 1)

    for (const msg of messages) {
      const {fatal, line, message, ruleId, severity} = msg

      // Exit if a fatal ESLint error occurred
      if (fatal) {
        throw Error(`${name} Lint error: ${message}`)
      }

      const entry = {
        path,
        firstLine: line,
        lastLine: line,
        message: `${removeTrailingPeriod(message)} (${ruleId})`
      }
      if (severity === 1) {
        lintResult.warning.push(entry)
      } else if (severity === 2) {
        lintResult.error.push(entry)
      }
    }
  }

  return lintResult
}

export default {name, verifySetup, lint, parseOutput}
