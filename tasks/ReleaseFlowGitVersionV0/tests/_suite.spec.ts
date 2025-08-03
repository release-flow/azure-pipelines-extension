import * as path from 'path';
import { expect } from 'chai';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import { ConfigFileName } from '@release-flow/release-flow';

function confirmVariableAssigned(tr: ttm.MockTestRunner, name: string, value: string): void {
  const setText = `##vso[task.setvariable variable=${name};isOutput=true;issecret=false;]${value}`;
  expect(tr.stdOutContained(setText)).to.equal(true, `should set variable ${name} = ${value}`);
}

// Building in Azure cloud seems much slower than local, occasionally
// the tests will timeout. If we need to change it we can do so in one place.
const TestTimeout = 60000; // ms

describe('ReleaseFlowGitVersion tests', function () {
  it('should succeed with prerelease output', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-PreRelease.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');

    // Check that variables were assigned
    confirmVariableAssigned(tr, 'Major', '1');
    confirmVariableAssigned(tr, 'Minor', '2');
    confirmVariableAssigned(tr, 'Patch', '3');
    confirmVariableAssigned(tr, 'MajorMinor', '1.2');
    confirmVariableAssigned(tr, 'MajorMinorPatch', '1.2.3');
    confirmVariableAssigned(tr, 'BranchName', 'feature/test-stuff');
    confirmVariableAssigned(tr, 'EscapedBranchName', 'feature-test-stuff');
    confirmVariableAssigned(tr, 'BuildType', 'working-branch');
    confirmVariableAssigned(tr, 'PreReleaseLabel', 'feature-test-stuff');
    confirmVariableAssigned(tr, 'Sha', '3b8a8098a534380da8a61a1ecb56b570cb52a20a');
    confirmVariableAssigned(tr, 'ShortSha', '3b8a809');
    confirmVariableAssigned(tr, 'CommitDate', '2020-02-07T15:52:51.000Z');
    confirmVariableAssigned(tr, 'CommitsSinceVersionSource', '4');
    confirmVariableAssigned(tr, 'CommitsSinceVersionSourcePadded', '0004');
    confirmVariableAssigned(tr, 'VersionSourceSha', 'b4220df81906afc0e804ab133ab5d825502a26ed');
    confirmVariableAssigned(tr, 'PreReleaseTag', 'feature-test-stuff.4');
    confirmVariableAssigned(tr, 'PreReleaseTagWithDash', '-feature-test-stuff.4');
    confirmVariableAssigned(tr, 'PreReleaseNumber', '4');
    confirmVariableAssigned(
      tr,
      'FullBuildMetaData',
      'Branch.feature/test-stuff.Sha.3b8a8098a534380da8a61a1ecb56b570cb52a20a'
    );
    confirmVariableAssigned(tr, 'SemVer', '1.2.3-feature-test-stuff.4');
    confirmVariableAssigned(tr, 'LegacySemVer', '1.2.3-feature-test-stuff4');
    confirmVariableAssigned(tr, 'AssemblySemVer', '1.2.0.0');
    confirmVariableAssigned(tr, 'AssemblySemFileVer', '1.2.3.0');
    confirmVariableAssigned(
      tr,
      'InformationalVersion',
      '1.2.3-feature-test-stuff.4+Branch.feature/test-stuff.Sha.3b8a8098a534380da8a61a1ecb56b570cb52a20a'
    );
    confirmVariableAssigned(tr, 'NuGetVersion', '1.2.3-feature-test-stuff0004');
    confirmVariableAssigned(tr, 'NuGetPreReleaseTag', 'feature-test-stuff0004');

    expect(tr.stdOutContained('##vso[build.updatebuildnumber]')).to.equal(false, 'Build number not updated');
  });

  it('should succeed with release output', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-Release.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');

    // Check that variables were assigned
    confirmVariableAssigned(tr, 'Major', '1');
    confirmVariableAssigned(tr, 'Minor', '2');
    confirmVariableAssigned(tr, 'Patch', '3');
    confirmVariableAssigned(tr, 'MajorMinor', '1.2');
    confirmVariableAssigned(tr, 'MajorMinorPatch', '1.2.3');
    confirmVariableAssigned(tr, 'BranchName', 'v1.2.3');
    confirmVariableAssigned(tr, 'EscapedBranchName', 'v1-2-3');
    confirmVariableAssigned(tr, 'BuildType', 'release');
    confirmVariableAssigned(tr, 'PreReleaseLabel', '');
    confirmVariableAssigned(tr, 'Sha', '3b8a8098a534380da8a61a1ecb56b570cb52a20a');
    confirmVariableAssigned(tr, 'ShortSha', '3b8a809');
    confirmVariableAssigned(tr, 'CommitDate', '2020-02-07T15:52:51.000Z');
    confirmVariableAssigned(tr, 'CommitsSinceVersionSource', '4');
    confirmVariableAssigned(tr, 'CommitsSinceVersionSourcePadded', '0004');
    confirmVariableAssigned(tr, 'VersionSourceSha', 'b4220df81906afc0e804ab133ab5d825502a26ed');
    confirmVariableAssigned(tr, 'PreReleaseTag', '');
    confirmVariableAssigned(tr, 'PreReleaseTagWithDash', '');
    confirmVariableAssigned(tr, 'PreReleaseNumber', '');
    confirmVariableAssigned(tr, 'FullBuildMetaData', 'Branch.v1.2.3.Sha.3b8a8098a534380da8a61a1ecb56b570cb52a20a');
    confirmVariableAssigned(tr, 'SemVer', '1.2.3');
    confirmVariableAssigned(tr, 'LegacySemVer', '1.2.3');
    confirmVariableAssigned(tr, 'AssemblySemVer', '1.2.0.0');
    confirmVariableAssigned(tr, 'AssemblySemFileVer', '1.2.3.0');
    confirmVariableAssigned(
      tr,
      'InformationalVersion',
      '1.2.3+Branch.v1.2.3.Sha.3b8a8098a534380da8a61a1ecb56b570cb52a20a'
    );
    confirmVariableAssigned(tr, 'NuGetVersion', '1.2.3');
    confirmVariableAssigned(tr, 'NuGetPreReleaseTag', '');

    expect(tr.stdOutContained('##vso[build.updatebuildnumber]')).to.equal(false, 'Build number not updated');
  });

  it('should fail when sourceBranch not specified', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-NoSourceBranch.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.failed).to.equal(true, 'should have failed');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.createdErrorIssue('Error: Input required: sourceBranch')).to.equal(
      true,
      'should have errored for missing input'
    );
  });

  it('should succeed when targetBranch not specified', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-Release.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');
  });

  it('should succeed when targetBranch specified', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-TargetBranch.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');
  });

  it('should use Build.SourcesDirectory when repoRoot not specified', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-NoRepoRoot.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');

    console.log(tr.stdout);
    expect(tr.stdOutContained("##vso[task.debug]Current directory: '/build/sourcesDirectory'")).to.equal(
      true,
      'uses Build.SourcesDirectory'
    );
  });

  it('should use repoRoot when specified', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-RepoRootSpecified.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');
    expect(tr.stdOutContained('Using non-standard repoRoot = /foo/bar')).to.equal(true, 'uses repoRoot when specified');
  });

  it('should warn when YAML config not present', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-NoYamlConfig.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.createdWarningIssue(`Config file '${ConfigFileName}' not found - using default options`)).to.equal(
      true,
      'should have warned for missing config file'
    );
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');

    // Partial check that variables were assigned
    confirmVariableAssigned(tr, 'Major', '1');
    confirmVariableAssigned(tr, 'Minor', '2');
    confirmVariableAssigned(tr, 'Patch', '3');
  });

  it('should update build number when variable is set', async function () {
    this.timeout(TestTimeout);

    const tp = path.join(__dirname, 'T-UpdateBuildNumber.js');
    const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

    await tr.runAsync();

    expect(tr.succeeded).to.equal(true, 'should have succeeded');
    expect(tr.warningIssues.length).to.equal(0, 'should have no warnings');
    expect(tr.errorIssues.length).to.equal(0, 'should have no errors');

    expect(tr.stdOutContained('##vso[build.updatebuildnumber]1.2.3-feature-test-stuff.4')).to.equal(
      true,
      'Build number updated'
    );
  });
});
