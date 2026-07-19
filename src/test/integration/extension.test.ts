import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'shin1007.white-noise';

const EXPECTED_COMMANDS = [
  'whiteNoise.openPanel',
  'whiteNoise.play',
  'whiteNoise.stop',
  'whiteNoise.pomodoro.start',
  'whiteNoise.pomodoro.pause',
  'whiteNoise.pomodoro.reset',
  'whiteNoise.pomodoro.skipPhase',
  'whiteNoise.statusBar.action',
];

describe('White Noise & Pomodoro extension', () => {
  it('is discoverable and activates without throwing', async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} should be installed in the test host`);
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true);
  });

  it('registers all contributed commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const command of EXPECTED_COMMANDS) {
      assert.ok(commands.includes(command), `expected command "${command}" to be registered`);
    }
  });

  it('contributes its configuration with the documented defaults', () => {
    const config = vscode.workspace.getConfiguration('whiteNoise');
    assert.strictEqual(config.get('enablePhaseEndScripts'), false);
    assert.strictEqual(config.get('statusBar.updateIntervalMs'), 1000);
  });

  // whiteNoise.play / openPanel / statusBar.action create the audio Webview, which needs a
  // real user gesture inside its own document before AudioContext can resume — not something
  // this headless suite can simulate, so playback itself is out of scope here.
  it('whiteNoise.stop does not throw when nothing is playing', async () => {
    await vscode.commands.executeCommand('whiteNoise.stop');
  });

  it('pomodoro lifecycle commands do not throw when run in sequence', async () => {
    await vscode.commands.executeCommand('whiteNoise.pomodoro.start');
    await vscode.commands.executeCommand('whiteNoise.pomodoro.pause');
    await vscode.commands.executeCommand('whiteNoise.pomodoro.reset');
  });
});
