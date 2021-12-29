import {LintResult, RunOutput} from '../types'
import commandExists from '../utils/command-exists'
import {getNpmBinCommand} from '../utils/npm/get-npm-bin-command'
import {initLintResult} from '../utils/lint-result'
import {run} from '../utils/action'

/** @typedef {import('../utils/lint-result').LintResult} LintResult */

/**
 * https://stylelint.io
 */

const name = 'WP-Scripts Lint Style'

/**
 * Verifies that all required programs are installed. Throws an error if programs are missing
 * @param {string} dir - Directory to run the linting program in
 * @param {string} prefix - Prefix to the lint command
 */
async function verifySetup(dir: string, prefix = ''): Promise<void> {
  // Verify that NPM is installed (required to execute stylelint)
  if (!(await commandExists('npm'))) {
    throw new Error('NPM is not installed')
  }

  // Verify that wp-scripts is installed
  const commandPrefix = prefix || getNpmBinCommand(dir)
  try {
    run(`${commandPrefix} wp-scripts lint-style -v`, {dir})
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message)
  }
}

/**
 * Runs the lint-style command and returns the command output
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
  fix = false,
  prefix = ''
): RunOutput {
  const files =
    extensions.length === 1
      ? `**/*.${extensions[0]}`
      : `**/*.{${extensions.join(',')}}`
  const fixArg = fix ? '--fix' : ''
  const commandPrefix = prefix || getNpmBinCommand(dir)
  return run(
    `${commandPrefix} wp-scripts lint-style --no-color --formatter json ${fixArg} ${args} "${files}"`,
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
    const {source, warnings} = violation
    const path = source.substring(dir.length + 1)
    for (const warning of warnings) {
      const {
        line,
        severity,
        text
      }: {line: number; severity: 'error' | 'warning'; text: string} = warning
      if (severity in lintResult) {
        lintResult[severity].push({
          path,
          firstLine: line,
          lastLine: line,
          message: text
        })
      }
    }
  }

  return lintResult
}

export default {name, verifySetup, lint, parseOutput}
