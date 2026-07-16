import type { PhaseConfig, PomodoroConfig, PomodoroState } from '../protocol';

type ActivePhase = 'focus' | 'break';

export interface PomodoroCallbacks {
  onTick(state: PomodoroState, remainingSec: number, totalSec: number): void;
  onPhaseChange(phase: ActivePhase, config: PhaseConfig): void;
  onPhaseEnd(phase: ActivePhase, config: PhaseConfig): void;
}

/**
 * Owns the single 1Hz interval for the whole extension (lives in the extension host, not a
 * webview, so it isn't throttled when the UI panel tab is backgrounded). statusBar.ts and,
 * when visible, UIPanelWebview both consume the same onTick callback -- see extension.ts.
 */
export class PomodoroTimer {
  private state: PomodoroState = {
    phase: 'idle',
    runState: 'stopped',
    phaseStartedAt: null,
    phaseDurationSec: 0,
    elapsedBeforePauseSec: 0,
  };
  private intervalHandle: ReturnType<typeof setInterval> | undefined;

  constructor(
    private config: PomodoroConfig,
    private readonly callbacks: PomodoroCallbacks,
    private readonly tickIntervalMs: number,
  ) {}

  updateConfig(config: PomodoroConfig): void {
    this.config = config;
  }

  getState(): PomodoroState {
    return this.state;
  }

  start(): void {
    if (this.state.runState === 'running') {
      return;
    }
    if (this.state.runState === 'paused') {
      this.resume();
      return;
    }
    this.beginPhase('focus');
  }

  pause(): void {
    if (this.state.runState !== 'running') {
      return;
    }
    this.state = { ...this.state, runState: 'paused', elapsedBeforePauseSec: this.elapsedSec(), phaseStartedAt: null };
    this.stopInterval();
    this.emitTick();
  }

  resume(): void {
    if (this.state.runState !== 'paused') {
      return;
    }
    this.state = { ...this.state, runState: 'running', phaseStartedAt: Date.now() };
    this.startInterval();
    this.emitTick();
  }

  reset(): void {
    this.stopInterval();
    this.state = { phase: 'idle', runState: 'stopped', phaseStartedAt: null, phaseDurationSec: 0, elapsedBeforePauseSec: 0 };
    this.emitTick();
  }

  skipPhase(): void {
    if (this.state.phase === 'idle') {
      return;
    }
    const endedPhase = this.state.phase;
    this.finishPhase(endedPhase, endedPhase === 'focus' ? 'break' : 'focus');
  }

  dispose(): void {
    this.stopInterval();
  }

  private phaseConfig(phase: ActivePhase): PhaseConfig {
    return phase === 'focus' ? this.config.focus : this.config.break;
  }

  private beginPhase(phase: ActivePhase): void {
    const config = this.phaseConfig(phase);
    this.state = { phase, runState: 'running', phaseStartedAt: Date.now(), phaseDurationSec: config.durationSec, elapsedBeforePauseSec: 0 };
    this.startInterval();
    this.callbacks.onPhaseChange(phase, config);
    this.emitTick();
  }

  private finishPhase(endedPhase: ActivePhase, next: ActivePhase): void {
    const endedConfig = this.phaseConfig(endedPhase);
    this.stopInterval();
    this.callbacks.onPhaseEnd(endedPhase, endedConfig);

    if (endedConfig.autoAdvance) {
      this.beginPhase(next);
    } else {
      this.state = { ...this.state, runState: 'stopped', phaseStartedAt: null, elapsedBeforePauseSec: this.state.phaseDurationSec };
      this.emitTick();
    }
  }

  private elapsedSec(): number {
    if (this.state.runState === 'running' && this.state.phaseStartedAt) {
      return this.state.elapsedBeforePauseSec + (Date.now() - this.state.phaseStartedAt) / 1000;
    }
    return this.state.elapsedBeforePauseSec;
  }

  private startInterval(): void {
    this.stopInterval();
    this.intervalHandle = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  private stopInterval(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }

  private tick(): void {
    const remaining = this.state.phaseDurationSec - this.elapsedSec();
    if (remaining <= 0 && (this.state.phase === 'focus' || this.state.phase === 'break')) {
      this.finishPhase(this.state.phase, this.state.phase === 'focus' ? 'break' : 'focus');
      return;
    }
    this.emitTick();
  }

  private emitTick(): void {
    const remaining = Math.max(0, this.state.phaseDurationSec - this.elapsedSec());
    this.callbacks.onTick(this.state, Math.ceil(remaining), this.state.phaseDurationSec);
  }
}
