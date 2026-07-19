import * as assert from 'assert';
import { PomodoroTimer, type PomodoroCallbacks } from '../../pomodoro/PomodoroTimer';
import type { PhaseConfig, PomodoroConfig } from '../../protocol';

function makePhase(overrides: Partial<PhaseConfig> = {}): PhaseConfig {
  return {
    durationSec: 60,
    presetId: null,
    autoAdvance: true,
    endAction: { showToast: false, playSound: false, runScript: false },
    ...overrides,
  };
}

function makeConfig(overrides: Partial<PomodoroConfig> = {}): PomodoroConfig {
  return { focus: makePhase(), break: makePhase(), ...overrides };
}

function noopCallbacks(overrides: Partial<PomodoroCallbacks> = {}): PomodoroCallbacks {
  return { onTick: () => {}, onPhaseChange: () => {}, onPhaseEnd: () => {}, ...overrides };
}

describe('PomodoroTimer', () => {
  it('starts idle and stopped', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    assert.strictEqual(timer.getState().phase, 'idle');
    assert.strictEqual(timer.getState().runState, 'stopped');
    timer.dispose();
  });

  it('start() begins the focus phase and notifies onPhaseChange', () => {
    let notifiedPhase: string | undefined;
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks({ onPhaseChange: (phase) => (notifiedPhase = phase) }), 1000);
    timer.start();
    assert.strictEqual(timer.getState().phase, 'focus');
    assert.strictEqual(timer.getState().runState, 'running');
    assert.strictEqual(notifiedPhase, 'focus');
    timer.dispose();
  });

  it('start() while already running is a no-op', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    timer.start();
    const startedAt = timer.getState().phaseStartedAt;
    timer.start();
    assert.strictEqual(timer.getState().phaseStartedAt, startedAt);
    timer.dispose();
  });

  it('pause() then resume() round-trips the running state', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    timer.start();
    timer.pause();
    assert.strictEqual(timer.getState().runState, 'paused');
    timer.resume();
    assert.strictEqual(timer.getState().runState, 'running');
    timer.dispose();
  });

  it('reset() returns to idle regardless of prior state', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    timer.start();
    timer.pause();
    timer.reset();
    assert.deepStrictEqual(timer.getState(), {
      phase: 'idle',
      runState: 'stopped',
      phaseStartedAt: null,
      phaseDurationSec: 0,
      elapsedBeforePauseSec: 0,
    });
    timer.dispose();
  });

  it('skipPhase() moves from focus to break and back', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    timer.start();
    assert.strictEqual(timer.getState().phase, 'focus');
    timer.skipPhase();
    assert.strictEqual(timer.getState().phase, 'break');
    timer.skipPhase();
    assert.strictEqual(timer.getState().phase, 'focus');
    timer.dispose();
  });

  it('skipPhase() while idle is a no-op', () => {
    const timer = new PomodoroTimer(makeConfig(), noopCallbacks(), 1000);
    timer.skipPhase();
    assert.strictEqual(timer.getState().phase, 'idle');
    timer.dispose();
  });

  it('does not auto-advance when autoAdvance is false', () => {
    const config = makeConfig({ focus: makePhase({ autoAdvance: false }) });
    const timer = new PomodoroTimer(config, noopCallbacks(), 1000);
    timer.start();
    timer.skipPhase();
    assert.strictEqual(timer.getState().phase, 'focus');
    assert.strictEqual(timer.getState().runState, 'stopped');
    timer.dispose();
  });

  it('auto-advances from focus to break once the phase duration elapses', function (done) {
    this.timeout(2000);
    const config = makeConfig({ focus: makePhase({ durationSec: 0.03 }), break: makePhase({ durationSec: 10 }) });
    let phaseEndedFired = false;
    const timer = new PomodoroTimer(
      config,
      noopCallbacks({
        onPhaseEnd: (phase) => {
          assert.strictEqual(phase, 'focus');
          phaseEndedFired = true;
        },
        onPhaseChange: (phase) => {
          if (phase === 'break') {
            assert.ok(phaseEndedFired, 'onPhaseEnd should fire before advancing to the next phase');
            timer.dispose();
            done();
          }
        },
      }),
      10,
    );
    timer.start();
  });
});
