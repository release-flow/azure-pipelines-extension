import * as path from 'path';
import * as tl from 'azure-pipelines-task-lib/task';
import BuildVersionCalculator, {
  ConfigurationReader,
  ConfigFileName,
  Options,
  RepoOptions,
  DefaultOptions,
  Logger,
} from '@release-flow/release-flow';

export class TaskLogger implements Logger {
  debug(message: string): void {
    tl.debug(message);
  }

  warn(message: string): void {
    tl.warning(message);
  }
  info(message: string): void {
    console.log(message);
  }
  error(message: string): void {
    tl.error(message);
  }
}

const log = new TaskLogger();

function setOutputVariable(name: string, value: string | undefined | null): void {
  const varValue = value ? value : '';
  tl.setVariable(name, varValue, false, true);
  log.info(`${name} = ${varValue}`);
}

// We can't use the filePathSupplied from the task library because the mock
// version is broken.
export function filePathSupplied(name: string): boolean {
  // normalize paths
  const pathValue = path.resolve(tl.cwd(), tl.getPathInput(name) || '');
  const repoRoot = path.resolve(tl.getVariable('build.sourcesDirectory') || '');

  const supplied = pathValue !== repoRoot;
  log.debug(name + ' path supplied :' + supplied);
  return supplied;
}

function getRepoRoot(): string {
  let repoRoot = tl.getPathInput('repoRoot', /*required*/ false, /*check*/ false);
  if (!repoRoot) {
    repoRoot = tl.resolve(tl.getVariable('Build.SourcesDirectory') || '');
    log.debug(`repoRoot not specified, using ${repoRoot}`);
  } else {
    repoRoot = tl.resolve(repoRoot);
    log.debug(`repoRoot specified, resolves to ${repoRoot}`);
    tl.checkPath(repoRoot, 'repoRoot');
  }

  return repoRoot;
}

function escapeForPreReleaseLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9-]/g, '-');
}

async function run(): Promise<void> {
  let pushd = false;
  try {
    // getInput errors if unsuccessful
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sourceBranch: string = tl.getInput('sourceBranch', true)!;
    const targetBranch: string | undefined = tl.getInput('targetBranch', false);

    const repoRoot = getRepoRoot();

    if (filePathSupplied('repoRoot')) {
      log.info(`Using non-standard repoRoot = ${repoRoot}`);
      tl.pushd(repoRoot);
      pushd = true;
    }

    const updateBuildNumber = tl.getBoolInput('updateBuildNumber');

    log.debug(`Source branch name: ${sourceBranch}`);
    log.debug(`Target branch name: ${targetBranch}`);
    log.debug(`Current directory: '${tl.cwd()}'`);

    const configReader = new ConfigurationReader();

    let configOptions: RepoOptions;
    if (!tl.exist(ConfigFileName)) {
      log.warn(`Config file '${ConfigFileName}' not found - using default options`);
      configOptions = DefaultOptions;
    } else {
      configOptions = configReader.getOptionsFromFile(ConfigFileName);
    }

    const options: Options = {
      ...configOptions,
      useOriginBranches: true,
    }
    const calc = new BuildVersionCalculator(log, options);
    const info = await calc.getBuildVersionInfo(sourceBranch, targetBranch);

    const commitsSinceVersionSourcePadded = info.commitsSinceVersionSource.toString().padStart(4, '0');
    const fullBuildMetaData = `Branch.${info.branchName}.Sha.${info.sha}`;
    let preReleaseNumber = '';
    let preReleaseTag = '';
    let preReleaseTagWithDash = '';
    let legacySemVerTagWithDash = '';
    let nuGetPreReleaseTag = '';
    let nuGetPreReleaseTagWithDash = '';
    if (info.buildType !== 'release') {
      preReleaseNumber = info.commitsSinceVersionSource.toString();
      preReleaseTag = `${info.preReleaseLabel}.${preReleaseNumber}`;
      preReleaseTagWithDash = `-${preReleaseTag}`;
      legacySemVerTagWithDash = `-${info.preReleaseLabel}${preReleaseNumber}`;
      nuGetPreReleaseTag = `${info.preReleaseLabel}${commitsSinceVersionSourcePadded}`;
      nuGetPreReleaseTagWithDash = `-${nuGetPreReleaseTag}`;
    }
    const semVer = `${info.majorMinorPatch}${preReleaseTagWithDash}`;

    setOutputVariable('Major', info.major.toString());
    setOutputVariable('Minor', info.minor.toString());
    setOutputVariable('Patch', info.patch.toString());
    setOutputVariable('MajorMinor', info.majorMinor);
    setOutputVariable('MajorMinorPatch', info.majorMinorPatch);
    setOutputVariable('BranchName', info.branchName);
    setOutputVariable('EscapedBranchName', escapeForPreReleaseLabel(info.branchName));
    setOutputVariable('BuildType', info.buildType);
    setOutputVariable('PreReleaseLabel', info.preReleaseLabel);
    setOutputVariable('Sha', info.sha);
    setOutputVariable('ShortSha', info.shortSha);
    setOutputVariable('CommitDate', info.commitDate.toISOString());
    setOutputVariable('CommitsSinceVersionSource', info.commitsSinceVersionSource.toString());
    setOutputVariable('VersionSourceSha', info.versionSourceSha);
    setOutputVariable('CommitsSinceVersionSourcePadded', commitsSinceVersionSourcePadded);
    setOutputVariable('PreReleaseTag', preReleaseTag);
    setOutputVariable('PreReleaseTagWithDash', `${preReleaseTagWithDash}`);
    setOutputVariable('PreReleaseNumber', preReleaseNumber);
    setOutputVariable('FullBuildMetaData', fullBuildMetaData);
    setOutputVariable('SemVer', semVer);
    setOutputVariable('LegacySemVer', `${info.majorMinorPatch}${legacySemVerTagWithDash}`);
    setOutputVariable('AssemblySemVer', `${info.majorMinor}.0.0`);
    setOutputVariable('AssemblySemFileVer', `${info.majorMinorPatch}.0`);
    setOutputVariable('InformationalVersion', `${semVer}+${fullBuildMetaData}`);
    setOutputVariable('NuGetVersion', `${info.majorMinorPatch}${nuGetPreReleaseTagWithDash}`);
    setOutputVariable('NuGetPreReleaseTag', nuGetPreReleaseTag);

    if (updateBuildNumber) {
      tl.command('build.updatebuildnumber', {}, semVer);
    }
  } catch (err) {
    log.debug(`Error: ${err}`);
    tl.setResult(tl.TaskResult.Failed, `${err}`);
  } finally {
    if (pushd) {
      tl.popd();
    }
  }
}

log.debug('Running ReleaseFlowVersion task');
log.debug(`Node version: ${process.version}`);
run();
