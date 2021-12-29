import {GithubContext, LintResult} from '../types'
import {capitalizeFirstLetter} from '../utils/string'
import core from '@actions/core'
import {name} from '../../package.json'
import request from '../utils/request'

/** @typedef {import('./context').GithubContext} GithubContext */
/** @typedef {import('../utils/lint-result').LintResult} LintResult */

/**
 * Creates a new check on GitHub which annotates the relevant commit with linting errors
 * @param {string} linterName - Name of the linter for which a check should be created
 * @param {string} sha - SHA of the commit which should be annotated
 * @param {GithubContext} context - Information about the GitHub repository and
 * action trigger event
 * @param {LintResult} lintResult - Parsed lint result
 * @param {boolean} neutralCheckOnWarning - Whether the check run should conclude as neutral if
 * there are only warnings
 * @param {string} summary - Summary for the GitHub check
 */
async function createCheck(
  linterName: string,
  sha: string,
  context: GithubContext,
  lintResult: LintResult,
  neutralCheckOnWarning: boolean,
  summary: string
): Promise<void> {
  const lintKeys = ['warning', 'error'] as const
  let annotations = lintKeys.map(key =>
    lintResult[key].map(result => ({
      path: result.path,
      start_line: result.firstLine,
      end_line: result.lastLine,
      annotation_level: key === 'warning' ? 'warning' : 'failure',
      message: result.message
    }))
  )

  // Only use the first 50 annotations (limit for a single API request)
  if (annotations.length > 50) {
    core.info(
      `There are more than 50 errors/warnings from ${linterName}. Annotations are created for the first 50 issues only.`
    )
    annotations = annotations.slice(0, 50)
  }

  let conclusion
  if (lintResult.isSuccess) {
    if (annotations.length > 0 && neutralCheckOnWarning) {
      conclusion = 'neutral'
    } else {
      conclusion = 'success'
    }
  } else {
    conclusion = 'failure'
  }

  const body = JSON.stringify({
    name: linterName,
    head_sha: sha,
    conclusion,
    output: {
      title: capitalizeFirstLetter(summary),
      summary: `${linterName} found ${summary}`,
      annotations
    }
  })
  try {
    core.info(
      `Creating GitHub check with ${conclusion} conclusion and ${annotations.length} annotations for ${linterName}…`
    )
    await request(
      `${process.env.GITHUB_API_URL}/repos/${context.repository.repoName}/check-runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // "Accept" header is required to access Checks API during preview period
          Accept: 'application/vnd.github.antiope-preview+json',
          Authorization: `Bearer ${context.token}`,
          'User-Agent': name
        },
        body
      }
    )
    core.info(`${linterName} check created successfully`)
  } catch (err) {
    if (err instanceof Error) {
      core.error(err)
      throw new Error(
        `Error trying to create GitHub check for ${linterName}: ${err.message}`
      )
    }
  }
}

export {createCheck}
