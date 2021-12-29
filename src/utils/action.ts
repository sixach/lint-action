import {RunOutput, RunProperties} from '../types'
import core from '@actions/core'
import {spawnSync} from 'child_process'

const RUN_OPTIONS_DEFAULTS = {dir: undefined, ignoreErrors: false, prefix: ''}

/**
 * Returns the value for an environment variable. If the variable is required but doesn't have a
 * value, an error is thrown
 * @param {string} name - Name of the environment variable
 * @param {boolean} required - Whether an error should be thrown if the variable doesn't have a
 * value
 * @returns {string | null} - Value of the environment variable
 */
function getEnv(name: string, required = false): string {
  const nameUppercase = name.toUpperCase()
  const value = process.env[nameUppercase]
  // Value is either not set (`undefined`) or set to `null`
  if (!value && required) {
    throw new Error(`Environment variable "${nameUppercase}" is not defined`)
  }

  return value || ''
}

/**
 * Executes the provided shell command
 * @param {string} cmd - Shell command to execute
 * @param {{dir: string, ignoreErrors: boolean}} [options] - {@see RUN_OPTIONS_DEFAULTS}
 * @returns {{status: number, stdout: string, stderr: string}} - Output of the shell command
 */
function run(cmd: string, options?: RunProperties): RunOutput {
  const optionsWithDefaults = {
    ...RUN_OPTIONS_DEFAULTS,
    ...options
  }

  core.debug(cmd)

  const spawn = spawnSync(cmd, {
    encoding: 'utf8',
    cwd: optionsWithDefaults.dir,
    maxBuffer: 20 * 1024 * 1024
  })

  const errorText = spawn.stderr.toString().trim()

  // If something bad happened
  if (errorText) {
    const output = {
      status: 0,
      stdout: spawn.stdout.trim(),
      stderr: ''
    }

    core.debug(`Stdout: ${output.stdout}`)

    return output
  } else {
    if (optionsWithDefaults.ignoreErrors) {
      const output = {
        status: spawn.status || undefined,
        stdout: spawn.stdout.trim(),
        stderr: spawn.stderr.trim()
      }

      core.debug(`Exit code: ${output.status}`)
      core.debug(`Stdout: ${output.stdout}`)
      core.debug(`Stderr: ${output.stderr}`)

      return output
    }
    throw new Error(errorText)
  }
}

export {getEnv, run}
