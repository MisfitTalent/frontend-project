# Repository Hosting Checklist

## GitHub

Configure these settings in the GitHub repository:

- set the default branch to `main`
- require pull requests before merging
- require at least one reviewer
- require conversation resolution before merging
- require status checks to pass before merging
- restrict direct pushes to `main`
- optionally protect `releases/*` branches with the same review and status check rules

Recommended status checks:

- `npm run lint`
- `npm run build`

## Azure DevOps

Configure these branch policies in Azure DevOps:

- require a pull request for `main`
- require reviewers for `main`
- require linked work items where your process expects them
- enable build validation for `main`
- prevent direct pushes to `main`
- apply similar policies to `releases/*` branches where relevant

Recommended build validation:

- install dependencies
- run `npm run lint`
- run `npm run build`

## Remote Setup

Before pushing:

- create or identify the GitHub repository URL
- create or identify the Azure DevOps repository URL if used
- add the remote(s) locally
- push `main`
- push feature branches as needed

## Current Local State

As of April 28, 2026:

- local integration branch: `main`
- standards templates and workflow docs: committed
- application work: still pending and not yet organized into final logical commits
