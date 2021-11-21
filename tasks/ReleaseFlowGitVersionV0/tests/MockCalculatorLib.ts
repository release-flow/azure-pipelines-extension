import { RepoOptions, DefaultOptions, BuildVersionInfo, ConfigFileName } from '@release-flow/release-flow';
import SpyLogger from './SpyLogger';

let versionInfoAnswer: BuildVersionInfo;
let optionsAnswer: RepoOptions;

function getVariableKey(name: string): string {
  return name.replace(/\./g, '_').toUpperCase();
}
function setVariable(name: string, value: string): void {
  const key = getVariableKey(name);
  process.env[key] = value;
}

setVariable('Build.SourcesDirectory', '/build/sourcesDirectory');

export function setOptionsAnswer(options: RepoOptions): void {
  optionsAnswer = options;
}

export function setVersionInfoAnswer(versionInfo: BuildVersionInfo): void {
  versionInfoAnswer = versionInfo;
}

export class ConfigurationReader {
  public getOptionsFromFile(): RepoOptions {
    if (!versionInfoAnswer) {
      throw new Error('Mock getOptionsFromFile called before OptionsAnswer was set');
    }
    return optionsAnswer;
  }
}

export default class BuildVersionCalculator {
  public getBuildVersionInfo(): Promise<BuildVersionInfo> {
    if (!versionInfoAnswer) {
      throw new Error('Mock getBuildVersionInfo called before VersionInfoAnswer was set');
    }
    return Promise.resolve(versionInfoAnswer);
  }
}

export { SpyLogger as Logger, RepoOptions, DefaultOptions, ConfigFileName, BuildVersionInfo };
