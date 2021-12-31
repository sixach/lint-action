const { join } = require("path");

const core = require("@actions/core");
const chalk = require("chalk");

const git = require("./git");
const { createCheck } = require("./github/api");
const { getContext } = require("./github/context");
const linters = require("./linters");
const { getSummary } = require("./utils/lint-result");

/**
 * Parses the action configuration and runs all enabled linters on matching files
 */
async function runAction() {
	const context = getContext();
	const fixMode = core.getInput("fix_mode") === "true";
	const skipVerification = core.getInput("git_no_verify") === "true";
	const continueOnError = core.getInput("continue_on_error") === "true";
	const gitName = core.getInput("git_name", { required: true });
	const gitEmail = core.getInput("git_email", { required: true });
	const commitMessage = core.getInput("commit_message", { required: true });
	const checkName = core.getInput("check_name", { required: true });
	const neutralCheckOnWarning = core.getInput("neutral_check_on_warning") === "true";
	const isPullRequest =
		context.eventName === "pull_request" || context.eventName === "pull_request_target";

	// If on a PR from fork: Display messages regarding action limitations
	if (isPullRequest && context.repository.hasFork) {
		core.error(
			"❌ This action does not have permission to create annotations on forks. You may want to run it only on `push` events.",
		);
		if (fixMode) {
			core.error(
				"❌ This action does not have permission to push to forks. You may want to run it only on `push` events.",
			);
		}
	}

	if (fixMode) {
		// Set Git committer username and password
		git.setUserInfo(gitName, gitEmail);
	}
	if (isPullRequest) {
		// Fetch and check out PR branch:
		// - "push" event: Already on correct branch
		// - "pull_request" event on origin, for code on origin: The Checkout Action
		//   (https://github.com/actions/checkout) checks out the PR's test merge commit instead of the
		//   PR branch. Git is therefore in detached head state. To be able to push changes, the branch
		//   needs to be fetched and checked out first
		// - "pull_request" event on origin, for code on fork: Same as above, but the repo/branch where
		//   changes need to be pushed is not yet available. The fork needs to be added as a Git remote
		//   first
		git.checkOutRemoteBranch(context);
	}

	let headSha = git.getHeadSha();

	let hasFailures = false;
	const checks = [];

	// Loop over all available linters
	for (const [linterId, linter] of Object.entries(linters)) {
		// Determine whether the linter should be executed on the commit
		if (core.getInput(linterId) === "true") {
			core.startGroup(`🚀 Run ${linter.name}`);

			const args = core.getInput(`${linterId}_args`);
			const lintDirRel = core.getInput(`${linterId}_dir`) || ".";
			const prefix = core.getInput(`${linterId}_prefix`);
			const lintDirAbs = join(context.workspace, lintDirRel);

			// Check that the linter and its dependencies are installed
			core.info(`➡️ Verifying setup for ${chalk.blue.bold(linter.name)}…`);
			await linter.verifySetup(lintDirAbs, prefix);
			core.info(`➡️ Verified ${chalk.blue.bold(linter.name)} setup`);

			// Lint and optionally auto-fix the matching files, parse code style violations
			core.info(
				`${fixMode ? "🔨 Fixing and linting" : "🔎 Linting"} files in ${lintDirAbs} with ${chalk.blue.bold(linter.name)}…`,
			);

			// Run linter command
			const lintOutput = linter.lint(lintDirAbs, args, fixMode, prefix);

			// Skip annotations for WP-Scripts Format
			if (!(linter.name === "WP-Scripts Format")) {
				// Parse output of linting command
				const lintResult = linter.parseOutput(context.workspace, lintOutput);
				const summary = getSummary(lintResult);
				core.info(
					`ℹ️ ${linter.name} found: ${summary}\n Result: ${lintResult.isSuccess ? "Success" : "Failure"}`,
				);

				if (!lintResult.isSuccess) {
					hasFailures = true;
				}

				const lintCheckName = checkName
					.replace(/\${linter}/g, linter.name)
					.replace(/\${dir}/g, lintDirRel !== "." ? `${lintDirRel}` : "")
					.trim();

				checks.push({ lintCheckName, lintResult, summary });
			}

			if (fixMode) {
				// Commit and push auto-fix changes
				if (git.hasChanges()) {
					git.commitChanges(commitMessage.replace(/\${linter}/g, linter.name), skipVerification);
					git.pushChanges(skipVerification);
				}
			}

			core.endGroup();
		}
	}

	// Add commit annotations after running all linters. To be displayed on pull requests, the
	// annotations must be added to the last commit on the branch. This can either be a user commit or
	// one of the auto-fix commits
	if (isPullRequest && fixMode) {
		headSha = git.getHeadSha();
	}

	core.startGroup("📝 Create check runs with commit annotations");
	await Promise.all(
		checks.map(({ lintCheckName, lintResult, summary }) =>
			createCheck(lintCheckName, headSha, context, lintResult, neutralCheckOnWarning, summary),
		),
	);
	core.endGroup();

	if (hasFailures && !continueOnError) {
		core.setFailed("❌ Linting failures detected. See check runs with annotations for details.");
	}
}

runAction().catch((error) => {
	core.debug(error.stack || "No error stack trace");
	core.setFailed(error.message);
});
