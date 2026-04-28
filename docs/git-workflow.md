# Git Workflow Standard

## Purpose

This repository follows a lightweight ReleaseFlow-style workflow:

- `main` is the primary integration branch
- `releases/<major>.<minor>` branches represent supported release lines
- feature and bug work is isolated in short-lived branches
- changes are merged through pull requests only

## Branching Strategy

Create a branch from `main` for normal work:

- `feature/<feature-name>`
- `feature/<area>/<feature-name>`
- `bugfix/<description>`
- `hotfix/<description>`
- `users/<username>/<description>`
- `users/<username>/<workitem>`

Create release branches only for new major or minor releases:

- `releases/1.0`
- `releases/1.1`

Hotfixes for an existing release must be applied to the relevant existing `releases/*` branch, not to a new release branch.

## Pull Request Rules

- Open a pull request for every change
- Target `main` for standard feature and bugfix work
- Target `releases/<major>.<minor>` only for release maintenance or hotfix work
- Keep each pull request focused on one logical change
- Complete validation before requesting review
- Do not mix unrelated refactors with feature or bugfix work

## Commit and Push Rules

The unit of change in Git is the commit, not the push.

Follow these rules:

- keep commits small and logically scoped
- use clear commit messages
- stage only files related to the current change
- push whenever the branch contains a coherent, reviewable unit of work

Avoid using "one file per push" as a blanket rule. A valid change often spans multiple files. The correct standard is one logical change per commit and one reviewable change per pull request.

## Review Expectations

Every pull request should include:

- a concise summary
- linked issue or work item where applicable
- clear validation notes
- screenshots for user interface changes where relevant
- notes on risk, rollout, or breaking changes where relevant

## GitHub and Azure DevOps

This repository includes:

- GitHub issue templates in `.github/ISSUE_TEMPLATE/`
- a GitHub pull request template in `.github/PULL_REQUEST_TEMPLATE.md`
- Azure DevOps pull request templates in `.azuredevops/`

Platform settings still need to be configured in GitHub and Azure DevOps to enforce branch protection, required reviewers, build validation, and pull request policies.
