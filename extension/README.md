
# Release Flow Extension for Azure DevOps

This extension contains Azure DevOps pipeline tools to support [Release
Flow](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/).

## Release Flow Git Version Task

This task analyses a Git repository that is assumed to follow Release Flow conventions, and outputs
[semantic version](https://semver.org)-compatible variables based on the repository history, plus the name of the source
branch for the build (as per the Azure Pipelines built-in `$(Build.SourceBranch)` variable).

You can find further details about Release Flow conventions and versioning logic in the
[README](https://github.com/release-flow/release-flow/blob/main/README.md) for the core library that this task uses.

Note: [since September
2022](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/azure-repos-git?view=azure-devops&tabs=yaml#shallow-fetch),
Azure Pipelines by default does a shallow fetch of the git repo. This means that the repo history that the task uses to
derive the version information is not included in the repo, so the task will not generate the correct values. To fix
this, set `fetchDepth` to an appropriate value in the checkout step. The depth needs to include at least the most recent
release branch. If your repo is not too large, we recommend that you use the value `0` to checkout the entire history.

### Configuration

A file (by default called `rfconfig.yml`) should be present in the repository root directory to configure the behaviour
of the task, in particular the selection of which versioning variant (see below) to use.

A basic file looks like this:

``` yaml
strategy:
  kind: SemVer # or Milestone
```

The core [release-flow documentation](https://github.com/release-flow/release-flow#readme) provides a detailed
description of all the configuration file options.

### Inputs

| Name         | Description |
| ------------ | ----------- |
| `sourceBranch` | Specifies the branch on which the build is taking place, or from which the build was triggered, e.g. `$(Build.SourceBranch)`. |
| `targetBranch` | If the build is triggered by a PR, specifies the target branch of the PR, e.g. `$(System.PullRequest.TargetBranch)`. |
| `updateBuildNumber` | Indicates whether to update the current build number to the calculated semantic version. |
| `repoRoot` | Specifies the directory where the Git repository is located.  Leave this empty to use the root of the repo for the current build, which is `$(Build.SourcesDirectory)`. |

### Outputs

| Name         | Description |
| ------------ | ----------- |
| `Major` | The major version number. |
| `Minor` | The minor version number. |
| `Patch` | The patch version number. |
| `MajorMinor` | The major and minor version number, e.g. `1.2`. |
| `MajorMinorPatch` | The major, minor, and patch version number, e.g. `1.2.3`. |
| `SemVer` | The [SemVer-2.0.0](https://semver.org/spec/v2.0.0.html)-compatible semantic version, e.g. `3.0.0-beta.1`. |
| `LegacySemVer` | The legacy ([SemVer-1.0.0](https://semver.org/spec/v1.0.0.html)) semantic version, e.g. `3.0.0-beta1`. |
| `AssemblySemVer` | The assembly version, e.g. `3.2.0.0`. |
| `AssemblySemFileVer` | The assemby file version, e.g. `3.2.1.0`. |
| `InformationalVersion` | The assembly informational version, including the semantic version and the full build metadata. |
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
| `PreReleaseTag` | The pre-release tag, e.g. `beta.4`. |
| `PreReleaseTagWithDash` | The pre-release tag, prefixed with a dash, e.g. `-beta.4`. |
| `PreReleaseNumber` | A strictly-increasing pre-release number that counts the commits since the version source, e.g. `4`. |
| `FullBuildMetaData` | The full build metadata including branch name and Git hash. |
| `NuGetVersion` | The legacy NuGet-compatible version, e.g. `3.0.0-beta0001`. |
| `NuGetPreReleaseTag` | The NuGet-compatible pre-release tag, e.g. `beta0001`. |

## Credits

Icons derived from [svgrepo.com](https://www.svgrepo.com/).

Built with the Microsoft [Azure Pipelines Task SDK](https://github.com/microsoft/azure-pipelines-task-lib).
