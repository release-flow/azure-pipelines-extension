
# Release Flow Extension for Azure DevOps

This extension contains Azure DevOps pipeline tasks that support Release Flow.

## Release Flow Git Version Task

This task analyses a repository that is assumed to follow [Release
Flow](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/) conventions, and outputs
version variables based on information in the repository, plus the name of the source branch for the build (as per the
Azure Pipelines built-in `$(Build.SourceBranch)` variable).

### Configuration

A file (by default called `rfconfig.yml`) should be present in the repository root directory to configure the behaviour
of the task, in particular the selection of which versioning variant (see below) to use.

A basic file looks like this:

``` yaml
strategy:
  kind: SemVer # or Milestone
```

The core [release-flow documentation](https://github.com/release-flow/release-flow#readme) provides a detailed
description of the configuration file options.

### Inputs

| Name         | Description |
| ------------ | ----------- |
| `sourceBranch` | Specifies the branch on which the build is taking place, or from which the build was triggered, e.g. `$(Build.SourceBranch)`. |
| `targetBranch` | If the build is triggered by a PR, specifies the target branch of the PR, e.g. `$(System.PullRequest.TargetBranch)`. |
| `updateBuildNumber` | Indicates whether to update the build number to the calculated semantic version. |
| `repoRoot` | Specifies the directory where the Git repository is located.  Leave this empty to use the root of the repo for the current build, which is `$(Build.SourcesDirectory)`. |

### Outputs

| Name         | Description |
| ------------ | ----------- |
| `Major` | The major version number. |
| `Minor` | The minor version number. |
| `Patch` | The patch version number. |
| `MajorMinor` | The major and minor version number, e.g. `1.2`. |
| `MajorMinorPatch` | The major, minor, and patch version number, e.g. `1.2.3`. |
| `SemVer` | The semantic version, e.g. `3.0.0-beta.1`. |
| `LegacySemVer` | The legact (v1) semantic version, e.g. `3.0.0-beta1`. |
| `AssemblySemVer` | The assembly version, e.g. `3.2.0.0`. |
| `AssemblySemFileVer` | The assemby file version, e.g. `3.2.1.0`. |
| `InformationalVersion` | The assembly informational version, e.g. `3.0.0-beta.1+1.Branch.release/3.0.0.Sha.28c853159a46b5a87e6cc9c4f6e940c59d6bc68a`. |
| `BranchName` | The name of the branch or tag that triggered the build, e.g. `release/3.0`. |
| `EscapedBranchName` | The branch name, escaped for SemVer compatibility e.g. `release-3.0`. |
| `BuildType` | The build type that was inferred from the source branch and repository state. One of: `alpha`, `beta`, `working-branch`, `pull-request`, `release`. |
| `Sha` | The Git hash of the commit that triggered the build. |
| `ShortSha` | The abbreviated Git hash of the commit that triggered the build. |
| `CommitDate` | The date and time of the commit that triggered the build in ISO 8601 standard format, e.g. `2020-02-07T15:52:51.000Z`. |
| `CommitsSinceVersionSource` | The number of commits on the ancestry path between the current commit and the last version source. |
| `CommitsSinceVersionSourcePadded` | Number of commits since version source padded to 4 digits, e.g. `0001`. |
| `VersionSourceSha` | The Git hash of the commit that was identified as the version source. |
| `PreReleaseLabel` | The pre-release label that was inferred from the source branch and repository state, e.g. `beta`, `feature-test-stuff`. |
| `PreReleaseTag` | The NuGet pre-release tag, e.g. `feature-test-stuff0004`. |
| `PreReleaseTagWithDash` | The NuGet pre-release tag, prefixed with a dash, e.g. `-feature-test-stuff0004`. |
| `PreReleaseNumber` | The NuGet pre-release number, e.g. `4`. |
| `FullBuildMetaData` | The full build metadata, e.g. `1.Branch.release/3.0.0.Sha.28c853159a46b5a87e6cc9c4f6e940c59d6bc68a`. |
| `NuGetVersion` | The legacy NuGet-compatible version, e.g. `3.0.0-beta0001`. |
| `NuGetPreReleaseTag` | The NuGet-compatible pre-release tag, e.g. `beta0001`. |
