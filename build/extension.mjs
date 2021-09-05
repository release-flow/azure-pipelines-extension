#!/usr/bin/env node

import fg from 'fast-glob';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises'
import { copyFile } from 'fs/promises';
import { spawn } from 'child_process';
import yargs from 'yargs';

function run(command) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command.cmd, command.args, {
      shell: true,
      stdio: 'inherit',
      cwd: command.cwd || process.cwd(),
    });
    cmd.on('error', (err) => {
      reject(err);
    });
    cmd.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`"${command.cmd}" exited with non-zero code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function ensureOutputDir(dirName) {
  const targetDir = path.join(outputDir, dirName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created '${targetDir}'`);
  }
}

async function copyFilesToOutput(source, targetDir, sourceDir) {
  sourceDir = sourceDir || process.cwd();
  const entries = fg.stream(source, { cwd: sourceDir, dot: true });
  for await (const entry of entries) {
    ensureOutputDir(path.dirname(entry));
    const source = path.join(sourceDir, entry);
    const target = path.join(targetDir, entry);
    console.log(`${source} -> ${target} (${path.dirname(entry)})`);
    await copyFile(source, target);
  }
}

function getIdSuffix(opts) {
  let suffix;
  if (opts.version.preReleaseTag == 'beta') {
    // Insert release number into beta tag
    suffix = `${opts.version.major}-${opts.version.minor}-beta`;
  } else {
    suffix = opts.version.preReleaseTag;
  }

  return suffix;
}

function getOptions(args) {
  const { buildType } = args;
  const version = {
    major: args.major,
    minor: args.minor,
    patch: args.patch,
    preReleaseNumber: args.preReleaseNumber,
    isPreRelease: true,
    buildType,
    preReleaseTag: args.preReleaseLabel.replace(/[^A-Za-z0-9\-_]/, '-'),
    extensionVersion: `${args.major}.${args.minor}.${args.patch}.${args.preReleaseNumber}`,
    publisher: args.publisherTest,
  };
  let taskPatchBase = args.preReleaseNumber;

  switch (buildType) {
    case 'beta':
      version.publisher = args.publisherRelease;
      break;

    case 'release':
      version.isPreRelease = false;
      version.preReleaseTag = null;
      version.extensionVersion = `${args.major}.${args.minor}.${args.patch}`;
      version.publisher = args.publisherRelease;
      taskPatchBase = args.patch;
      break;

    default:
      break;
  }

  // Generate an incrementing weighted patch number to ensure that the task patch number
  // always increases. This is because Azure DevOps will select the task with the highest
  // version number.
  version.taskPatch = args.major * 10000 + args.minor * 100 + taskPatchBase;

  return { args, version };
}

/**
 * Munges the extension manifest by setting the version number, publisher etc.
 *
 */
async function mungeExtensionManifest() {
  const manifestFile = path.join(outputDir, 'vss-extension.json');
  console.log(`Munging extension manifest ${manifestFile}`);
  let jsonText = await fsPromises.readFile(manifestFile);
  let manifest = JSON.parse(jsonText);
  const opts = getOptions(argv);

  manifest.version = opts.version.extensionVersion;
  manifest.publisher = opts.version.publisher;

  if (opts.version.isPreRelease) {
    const idSuffix = getIdSuffix(opts);
    manifest.id = `${manifest.id}-${idSuffix}`;
    manifest.name = `${manifest.name} (${opts.args.branchName})`;
  }

  const data = JSON.stringify(manifest);
  await fsPromises.writeFile(manifestFile, data);
}

async function copyExtensionFiles() {
  await copyFilesToOutput(['**/*'], outputDir, 'extension');
  await mungeExtensionManifest();
}

async function copyTaskFiles(taskName) {
  // taskName is the name of the directory relative to tasks/
  ensureOutputDir(taskName);
  const taskInputDir = path.join('tasks/', taskName);
  const taskOutputDir = path.join(outputDir, taskName);

  // Copy across task files
  await copyFilesToOutput(['**/*.js', 'task.json', '!tests/**/*'], taskOutputDir, taskInputDir);

  // NPM install
  await copyFilesToOutput(['package.json', 'package-lock.json'], taskOutputDir, '.');
  // Ensure node_modules in dist
  const command = {
    cmd: 'npm',
    args: ['ci', '--production'],
    cwd: taskOutputDir
  }
  await run(command);
}

async function main() {
  await copyExtensionFiles();
  await copyTaskFiles('ReleaseFlowGitVersion');
}


const argv = yargs(process.argv.slice(2))
  .options({
    major: {
      default: 0,
      type: 'number',
    },
    minor: {
      default: 0,
      type: 'number',
    },
    patch: {
      default: 0,
      type: 'number',
    },
    buildType: {
      default: 'local',
      type: 'string',
    },
    branchName: {
      default: 'local development',
      type: 'string',
    },
    preReleaseNumber: {
      default: 1,
      type: 'number',
    },
    preReleaseLabel: {
      default: 'local',
      type: 'string',
    },
    publisherTest: {
      default: 'mbstest',
      type: 'string',
    },
    publisherRelease: {
      default: 'mbstest',
      type: 'string',
    },
    outputDir: {
      default: 'dist/',
      type: 'string',
    },
    serverBuild: {
      type: 'boolean',
      default: false,
    },
  }).argv;

console.log(`CWD = ${process.cwd()}`);

const outputDir = argv.outputDir;

await main();
