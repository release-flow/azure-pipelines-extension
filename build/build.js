#!/usr/bin/env node

const log = require('loglevel');
const path = require('path');
let del; // Imported async in main() because it's ES6 only
const fs = require('fs');
const fsPromises = fs.promises;
let globby; // Imported async in main() because it's ES6 only
const spawn = require('child_process').spawn;
const yargs = require('yargs');

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
    buildCounter: {
      default: 0,
      type: 'number',
    },
    buildType: {
      default: 'local',
      type: 'string',
    },
    preReleaseNumber: {
      default: 1,
      type: 'number',
    },
    preReleaseLabel: {
      default: null,
      type: 'string',
    },
    publisher: {
      default: 'local',
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
    verbose: {
      type: 'boolean',
      default: false,
    },
    clean: {
      type: 'boolean',
      default: false,
    },
  }).argv;

argv.isPreRelease = !!argv.preReleaseLabel;

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

async function ensureOutputDir(dirName) {
  const targetDir = path.resolve(outputDir, dirName);
  await fsPromises.mkdir(targetDir, { recursive: true });
}

async function prepareOutputDir() {
  if (argv.clean && fs.existsSync(argv.outputDir)) {
    await del(path.join(argv.outputDir, '**'))
  }

  await fsPromises.mkdir(argv.outputDir, { recursive: true });
}

async function copyFilesToOutput(patterns, rootDir, targetDir) {
  rootDir = rootDir || process.cwd();
  targetDir = targetDir || argv.outputDir;
  const entries = await globby(patterns, { cwd: rootDir, dot: true });
  for await (const entry of entries) {
    await ensureOutputDir(path.dirname(entry));
    const source = path.join(rootDir, entry);
    const target = path.join(targetDir, entry);
    log.debug(`${source} -> ${target} (${path.dirname(entry)})`);
    await fsPromises.copyFile(source, target);
  }
}

function getExtensionSuffix() {
  let suffix;
  switch (argv.preReleaseLabel) {
    case 'beta':
      suffix = `${argv.major}-${argv.minor}-beta`;
      break;

    case null:
    case '':
      suffix = '';
      break;

    default:
      // Need to replace unsupported characters -
      // extensionId may only include letters, numbers, underscores, and dashes
      suffix = argv.preReleaseLabel.replace(/[^A-Za-z0-9_-]/g, '_');
      break;
  }

  return suffix;
}


/**
 * Munges the extension manifest by setting the version number, etc.
 *
 */
async function mungeExtensionManifest() {
  const manifestFile = path.join(outputDir, 'vss-extension.json');
  log.debug(`Munging extension manifest ${manifestFile}`);
  let jsonText = await fsPromises.readFile(manifestFile);
  let manifest = JSON.parse(jsonText);

  manifest.version = `${argv.major}.${argv.minor}.${argv.patch}`;

  if (argv.isPreRelease) {
    // Add a suffix to the ID and name. This means each source branch will produce a different
    // extension ID, to prevent version numbering clashes
    const idSuffix = getExtensionSuffix();
    manifest.id = `${manifest.id}-${idSuffix}`;
    manifest.name = `${manifest.name} (${idSuffix})`;

    log.debug(`Override extension id = ${manifest.id}`);
    log.debug(`Override extension name = ${manifest.name}`);

    // Increment the patch number with each build
    const buildNum = (argv.preReleaseNumber * 1000) + argv.buildCounter
    manifest.version += `.${buildNum}`;

    manifest.galleryFlags = manifest.galleryFlags || [];
    manifest.galleryFlags.push("Preview");

    if (argv.buildType === 'beta') {
      manifest.public = true;
    } else {
      manifest.public = false;
    }
  } else {
    manifest.public = true;
  }

  log.debug(`Override extension version = ${manifest.version}`);

  const data = JSON.stringify(manifest);
  await fsPromises.writeFile(manifestFile, data);
}

async function copyExtensionFiles() {
  await copyFilesToOutput(['**/*'], 'extension', outputDir);
  await mungeExtensionManifest();
}

async function mungeTaskJsonFile() {

}

async function copyTaskFiles(taskName) {
  // taskName is the name of the directory relative to tasks/
  await ensureOutputDir(taskName);
  const taskInputDir = path.join('tasks/', taskName);
  const taskOutputDir = path.join(outputDir, taskName);

  // Copy across task files
  await copyFilesToOutput(['**/*.js', 'task.json', 'icon.png', '!tests/**/*'], taskInputDir, taskOutputDir);

  let taskPatch = argv.major * 10000 + argv.minor * 100 + argv.patch;

  log.debug(`Pre-release number = ${argv.preReleaseNumber}`);
  if (argv.isPreRelease) {
    // If pre-release we need to add another increment, to ensure that the patch version
    // doesn't collide with a previous task number
    taskPatch = (taskPatch * 10000) + (argv.preReleaseNumber * 100) + argv.buildCounter
    log.debug(`Pre-release override of task patch to ${taskPatch}`);
  } else {
    taskPatch = (taskPatch * 100) + argv.buildCounter
    log.debug(`Override of task patch to ${taskPatch}`);
  }
}

async function installNpm() {
  // NPM install
  await copyFilesToOutput(['package.json', 'package-lock.json']);
  // Ensure node_modules in dist
  const command = {
    cmd: 'npm',
    args: ['ci', '--omit=dev'],
    cwd: outputDir
  }
  await run(command);
}

async function main() {
  // Globby is ES6-only, meaning we can't require() it or we get a ERR_REQUIRE_ESM error.
  // This is the resolution, see
  // https://github.com/sindresorhus/globby/issues/193#issuecomment-1021493812
  // The preferable solution would be to convert this script into ES6, but one of the other
  // modules (tfx-cli, IIRC) prevented it.
  ({ del } = await import('del'));
  ({ globby } = await import('globby'));
  await prepareOutputDir();
  await copyExtensionFiles();
  await installNpm();
  await copyTaskFiles('ReleaseFlowGitVersionV0');
}

/******************************************************************************
 * MAIN LOGIC STARTS HERE
 */
log.setDefaultLevel('INFO');

if (argv.verbose || (process.env.SYSTEM_DEBUG && process.env.SYSTEM_DEBUG.toLowerCase() === 'true')) {
  log.setLevel('DEBUG');
}

log.debug(`CWD = ${process.cwd()}`);

const outputDir = argv.outputDir;

main();
