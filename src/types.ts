import {RequestOptions} from 'https'

export interface PostRequestOptions extends RequestOptions {
  body: string
}

export interface LintResultItem {
  path: string
  firstLine: number
  lastLine: number
  message: string
}

export interface LintResult {
  isSuccess: boolean
  warning: LintResultItem[]
  error: LintResultItem[]
}

export interface RunProperties {
  dir?: string
  ignoreErrors?: boolean
}

export interface RunOutput {
  status?: number
  stdout: string
  stderr: string
}

export interface GithubRepository {
  repoName: string
  cloneUrl: string
  forkName?: string
  forkCloneUrl?: string | URL
  hasFork: boolean
}

export interface GithubContext {
  actor: string
  branch?: string
  event: object
  eventName: string
  eventPath?: string
  repository: GithubRepository
  token: string
  workspace: string
}

export interface GithubAnnotationItem {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'warning' | 'failure'
  message: string
}

export interface GithubAnnotations {
  [key: string]: GithubAnnotationItem
}

interface Repository {
  full_name: string
  clone_url: string
}

interface InfoRepoObj {
  ref: string
  repo: Repository
}

interface PullRequest {
  head: InfoRepoObj
}

export interface GithubEvent {
  ref: string
  pull_request: PullRequest
  repository: Repository
}

export interface ActionEnv {
  actor: string
  eventName: string
  eventPath: string
  token: string
  workspace: string
}
