import {existsSync} from 'fs'
import {join} from 'path'

const YARN_LOCK_NAME = 'yarn.lock'

/**
 * Determines whether Yarn should be used to execute commands or binaries. This decision is based on
 * the existence of a Yarn lockfile in the package directory. The distinction between NPM and Yarn
 * is necessary e.g. for Yarn Plug'n'Play to work
 * @param {string} [pkgRoot] - Package directory (directory where Yarn lockfile would exist)
 * @returns {boolean} - Whether Yarn should be used
 */
function useYarn(pkgRoot: string): boolean {
  // Use an absolute path if `pkgRoot` is specified and a relative one (current directory) otherwise
  const lockfilePath = pkgRoot ? join(pkgRoot, YARN_LOCK_NAME) : YARN_LOCK_NAME
  return existsSync(lockfilePath)
}

export {useYarn}
