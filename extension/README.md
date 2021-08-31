
# Muddy Boots Versioning Tasks for Azure DevOps

This extension contains Azure DevOps pipeline custom tasks that support build versioning.

## Release Flow Git Version Task

This task analyses a repository that is assumed to follow [Release Flow](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/) conventions, and outputs version variables based on information in the repository, plus the name of the source branch for the build (as per the Azure Pipelines built-in `$(Build.SourceBranch)` variable).

### Configuration

A file (by default called `rfconfig.yml`) should be present in the repository root directory to configure the behaviour
of the task, in particular the selection of which versioning variant (see below) to use.

A basic file looks like this:

``` yaml
strategy:
  kind: SemVer # or Milestone
```

The [release-flow documentation](https://github.com/release-flow/release-flow#readme) provides a detailed description of the configuration options.
