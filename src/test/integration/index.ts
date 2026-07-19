import * as path from 'path';
import * as fs from 'fs';
import Mocha = require('mocha');

/**
 * VS Code のテストホストが実行時に require するエントリポイントです（旧来の
 * vscode-test 規約）。同じディレクトリの *.test.js を集めて Mocha で実行します。
 */
export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 20000 });
  const testsRoot = path.resolve(__dirname);
  const files = fs.readdirSync(testsRoot).filter((f) => f.endsWith('.test.js'));
  for (const file of files) {
    mocha.addFile(path.join(testsRoot, file));
  }

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}
