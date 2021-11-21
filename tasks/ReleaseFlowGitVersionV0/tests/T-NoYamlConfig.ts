import * as ma from 'azure-pipelines-task-lib/mock-answer';
import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';
import moment from 'moment';
import * as MockCalculatorLib from './MockCalculatorLib';

const taskPath = path.join(__dirname, '..', 'index.js');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

const versionResult = new MockCalculatorLib.BuildVersionInfo(
  1,
  2,
  3,
  'alpha',
  '3b8a8098a534380da8a61a1ecb56b570cb52a20a',
  'alpha',
  'master',
  moment(1581090771, 'X'),
  3,
  'b4220df81906afc0e804ab133ab5d825502a26ed'
);

MockCalculatorLib.setOptionsAnswer(MockCalculatorLib.DefaultOptions);
MockCalculatorLib.setVersionInfoAnswer(versionResult);

const mockedAnswers: ma.TaskLibAnswers = {
  checkPath: {
    'foo/bar': true,
  },
  cwd: { cwd: '/build/sourcesDirectory' },
};

tmr.setAnswers(mockedAnswers);

tmr.setInput('sourceBranch', 'refs/heads/master');
tmr.setInput('repoRoot', '');
tmr.registerMock('@release-flow/release-flow', MockCalculatorLib);

tmr.run();
