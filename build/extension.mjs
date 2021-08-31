#!/usr/bin/env node

import fg  from 'fast-glob';
import * as path from 'path';
import * as fs from 'fs';
import { copyFile } from 'fs/promises';
import { spawn } from 'child_process';

console.log(`CWD = ${process.cwd()}`);

const outputDir = 'dist/';

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

async function copyExtensionFiles() {
  await copyFilesToOutput(['**/*'], outputDir, 'extension');
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

await main();
