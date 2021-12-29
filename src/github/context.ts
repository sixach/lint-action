import {ActionEnv, GithubContext, GithubEvent, GithubRepository} from '../types'
import core from '@actions/core'
import {getEnv} from '../utils/action'
import {name} from '../../package.json'
import {readFileSync} from 'fs'

/**
 * GitHub Actions workflow's environment variables
 * @typedef ActionEnv
 * @property {string} actor Event actor.
 * @property {string} eventName Event name.
 * @property {string} eventPath Event path.
 * @property {string} token Token.
 * @property {string} workspace Workspace path.
 */

/**
 * Information about the GitHub repository and its fork (if it exists)
 * @typedef GithubRepository
 * @property {string} repoName Repo name.
 * @property {string} cloneUrl Repo clone URL.
 * @property {string} forkName Fork name.
 * @property {string} forkCloneUrl Fork repo clone URL.
 * @property {boolean} hasFork Whether repo has a fork.
 */

/**
 * Information about the GitHub repository and action trigger event
 * @typedef GithubContext
 * @property {string} actor Event actor.
 * @property {string} branch Branch name.
 * @property {object} event Event.
 * @property {string} eventName Event name.
 * @property {GithubRepository} repository Information about the GitHub repository
 * @property {string} token Token.
 * @property {string} workspace Workspace path.
 */

/**
 * Returns the GitHub Actions workflow's environment variables
 * @returns {ActionEnv} GitHub Actions workflow's environment variables
 */
function parseActionEnv(): ActionEnv {
  return {
    // Information provided by environment
    actor: getEnv('github_actor', true),
    eventName: getEnv('github_event_name', true),
    eventPath: getEnv('github_event_path', true),
    workspace: getEnv('github_workspace', true),

    // Information provided by action user
    token: core.getInput('github_token', {required: true})
  }
}

/**
 * Parse `event.json` file (file with the complete webhook event payload, automatically provided by
 * GitHub)
 * @param {string} eventPath - Path to the `event.json` file
 * @returns {object} - Webhook event payload
 */
function parseEnvFile(eventPath: string): GithubEvent {
  const eventBuffer = readFileSync(eventPath, 'utf8')
  return JSON.parse(eventBuffer)
}

/**
 * Parses the name of the current branch from the GitHub webhook event
 * @param {string} eventName - GitHub event type
 * @param {object} event - GitHub webhook event payload
 * @returns {string} - Branch name
 */
function parseBranch(eventName: string, event: GithubEvent): string {
  if (eventName === 'push' || eventName === 'workflow_dispatch') {
    return event.ref.substring(11) // Remove "refs/heads/" from start of string
  }
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    return event.pull_request.head.ref
  }
  throw Error(`${name} does not support "${eventName}" GitHub events`)
}

/**
 * Parses the name of the current repository and determines whether it has a corresponding fork.
 * Fork detection is only supported for the "pull_request" event
 * @param {string} eventName - GitHub event type
 * @param {object} event - GitHub webhook event payload
 * @returns {GithubRepository} - Information about the GitHub repository and its fork (if it exists)
 */
function parseRepository(
  eventName: string,
  event: GithubEvent
): GithubRepository {
  const repoName = event.repository.full_name
  const cloneUrl = event.repository.clone_url
  let forkName
  let forkCloneUrl
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    // "pull_request" events are triggered on the repository where the PR is made. The PR branch can
    // be on the same repository (`forkRepository` is set to `null`) or on a fork (`forkRepository`
    // is defined)
    const headRepoName = event.pull_request.head.repo.full_name
    forkName = repoName === headRepoName ? undefined : headRepoName
    const headForkCloneUrl = event.pull_request.head.repo.clone_url
    forkCloneUrl = cloneUrl === headForkCloneUrl ? undefined : headForkCloneUrl
  }
  return {
    repoName,
    cloneUrl,
    forkName,
    forkCloneUrl,
    hasFork: forkName != null && forkName !== repoName
  }
}

/**
 * Returns information about the GitHub repository and action trigger event
 * @returns {GithubContext} context - Information about the GitHub repository and action trigger
 * event
 */
function getContext(): GithubContext {
  const {actor, eventName, eventPath, token, workspace} = parseActionEnv()
  const event = parseEnvFile(eventPath)
  return {
    actor,
    branch: parseBranch(eventName, event),
    event,
    eventName,
    repository: parseRepository(eventName, event),
    token,
    workspace
  }
}

export {getContext, parseActionEnv, parseBranch, parseEnvFile, parseRepository}
