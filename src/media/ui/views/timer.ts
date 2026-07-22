import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { strings } from '../i18n';
import {
  formatPomodoroStatus,
  formatRemaining,
  listenTimerMinutes,
  listenTimerRemainingSec,
  openPomodoroSettings,
  pomodoroRemainingSec,
  pomodoroState,
  post,
  setListenTimerMinutes,
  setListenTimerRemainingSec,
  setPomodoroRemainingMinutes,
  setTimerTab,
  timerTab,
  updatePomodoroConfig,
} from '../state';
import { createTimerSeekbar, updateTimerSeekbar } from './timerSeekbar';

function renderSleepTab(container: HTMLElement): void {
  const pomodoroActive = pomodoroState.runState !== 'stopped';
  const counting = listenTimerRemainingSec !== null;

  const seekbar = createTimerSeekbar('sleep-timer-seekbar', {
    interactive: !pomodoroActive,
    onSetMinutes: (minutes) => {
      if (counting) {
        setListenTimerRemainingSec(minutes * 60);
      } else {
        setListenTimerMinutes(minutes);
        updateTimerSeekbar('sleep-timer-seekbar', minutes * 60, minutes === 0 ? strings.timer.none : strings.timer.minutesUnit(minutes));
      }
    },
  });
  container.appendChild(seekbar);

  const initialRemainingSec = counting ? (listenTimerRemainingSec as number) : listenTimerMinutes * 60;
  const initialLabel = counting ? formatRemaining(listenTimerRemainingSec as number) : listenTimerMinutes === 0 ? strings.timer.none : strings.timer.minutesUnit(listenTimerMinutes);
  updateTimerSeekbar('sleep-timer-seekbar', initialRemainingSec, initialLabel);

  if (pomodoroActive) {
    container.appendChild(el('p', { className: 'timer-guard-note', text: strings.timer.sleepGuardNote }));
  }
}

function renderPomodoroTab(container: HTMLElement, s: WhiteNoiseSettings): void {
  const sleepActive = listenTimerRemainingSec !== null;
  const isCounting = pomodoroState.runState !== 'stopped';
  // idle 中にダイヤルで編集する対象は、次に開始したときに使われる集中/休憩フェーズです。
  const activePhase: 'focus' | 'break' = pomodoroState.phase === 'break' ? 'break' : 'focus';
  const phaseConfig = s.pomodoro[activePhase];

  const seekbar = createTimerSeekbar('pomodoro-timer-seekbar', {
    interactive: !sleepActive,
    onSetMinutes: (minutes) => {
      if (isCounting) {
        setPomodoroRemainingMinutes(minutes);
      } else {
        updatePomodoroConfig((c) => (c[activePhase].durationSec = minutes * 60));
        updateTimerSeekbar('pomodoro-timer-seekbar', minutes * 60, strings.timer.minutesUnit(minutes));
      }
    },
  });
  container.appendChild(seekbar);

  const initialRemainingSec = isCounting ? pomodoroRemainingSec : phaseConfig.durationSec;
  const initialLabel = isCounting ? formatRemaining(pomodoroRemainingSec) : strings.timer.minutesUnit(Math.round(phaseConfig.durationSec / 60));
  updateTimerSeekbar('pomodoro-timer-seekbar', initialRemainingSec, initialLabel);

  container.appendChild(el('div', { className: 'status-line', id: 'pomodoro-status', text: formatPomodoroStatus() }));

  const startButton = button(pomodoroState.runState === 'paused' ? strings.timer.resume : strings.timer.start, 'preset-button', () => post({ type: 'ui:pomodoroStart' }));
  startButton.disabled = sleepActive;

  container.appendChild(
    el('div', { className: 'preset-list' }, [
      startButton,
      button(strings.timer.pause, 'preset-button', () => post({ type: 'ui:pomodoroPause' })),
      button(strings.timer.reset, 'preset-button', () => post({ type: 'ui:pomodoroReset' })),
      button(strings.timer.skipPhase, 'preset-button', () => post({ type: 'ui:pomodoroSkipPhase' })),
    ]),
  );
  if (sleepActive) {
    container.appendChild(el('p', { className: 'timer-guard-note', text: strings.timer.pomodoroGuardNote }));
  }
}

/** リスニング（スリープ）タイマーとポモドーロタイマーを1つの「タイマー」セクションにまとめ、
 * 共通のシークバーで表示・操作します。ON/OFF ボタンは表示モードの切替のみで、
 * ポモドーロ自体の開始/一時停止/リセットは別ボタンで行います。両方が同時に再生を制御すると
 * 分かりづらくなるため、一方が動作中はもう一方のシークバー操作・開始操作を無効化します。 */
export function renderTimerSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const pomodoroToggle = button(
    strings.timer.pomodoroToggle(timerTab === 'pomodoro'),
    'pomodoro-toggle-button' + (timerTab === 'pomodoro' ? ' is-on' : ''),
    () => setTimerTab(timerTab === 'pomodoro' ? 'sleep' : 'pomodoro'),
  );
  const settingsButton = button('⚙', 'icon-button', openPomodoroSettings);
  const headerRow = el('div', { className: 'label-row' }, [
    el('h3', { text: strings.timer.heading }),
    el('div', { className: 'timer-header-actions' }, [pomodoroToggle, settingsButton]),
  ]);
  const section = el('div', { className: 'section' }, [headerRow]);

  if (timerTab === 'sleep') {
    renderSleepTab(section);
  } else {
    renderPomodoroTab(section, s);
  }

  app.appendChild(section);
}
