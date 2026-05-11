---
name: github-governance
description: Git branch and GitHub workflow guidance for this repository. Use when organizing work across branches, deciding whether to create a new branch, or aligning changes with an existing branch purpose.
---

# GitHub Governance

Follow ReleaseFlow as the default branching strategy for this repository.

Keep `main` high quality and up to date.

For every fix or feature, create or identify the corresponding GitHub issue first.

Connect each commit to that issue using the repository's commit message convention.

Once the work is complete, open or update the pull request that corresponds to the issue and branch.

Do not treat code changes, commits, and PRs as separate untracked steps. The expected flow is:

1. Issue
2. Branch
3. Commit with issue reference
4. Pull request linked to the same issue

Create a new branch for every bug fix or feature unless the work clearly belongs on an existing matching branch.

Before creating a branch, inspect the current branch list and recent history.

If an existing branch already matches the scope of the requested work, continue on that branch instead of creating a duplicate branch.

When duplicate branches already exist for the same workstream, move the work back to the branch whose name and purpose best match the changes.

Do not create or use `codex/*` branch names in this repository.

Use only these branch naming conventions unless the user explicitly says otherwise:

- `feature/feature-name`
- `feature/feature-area/feature-name`
- `bugfix/description`
- `hotfix/description`
- `users/username/description`
- `users/username/workitem`

For release branches, use:

- `releases/{major}.{minor}`

Examples:

- `releases/1.0`
- `releases/1.1`

Create release branches only for new major or minor releases.

Apply hotfixes on the relevant existing release branch or branches.

Do not create client-specific branches on a product development repository.

If a requirement is client-specific, keep it out of the product codebase and handle it in the client-specific repository instead.
