import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
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
        updateTimerSeekbar('sleep-timer-seekbar', minutes * 60, minutes === 0 ? 'なし' : `${minutes}分`);
      }
    },
  });
  container.appendChild(seekbar);

  const initialRemainingSec = counting ? (listenTimerRemainingSec as number) : listenTimerMinutes * 60;
  const initialLabel = counting ? formatRemaining(listenTimerRemainingSec as number) : listenTimerMinutes === 0 ? 'なし' : `${listenTimerMinutes}分`;
  updateTimerSeekbar('sleep-timer-seekbar', initialRemainingSec, initialLabel);

  if (pomodoroActive) {
    container.appendChild(el('p', { className: 'timer-guard-note', text: 'ポモドーロ実行中は使用できません。リセットすると使えます。' }));
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
        updateTimerSeekbar('pomodoro-timer-seekbar', minutes * 60, `${minutes}分`);
      }
    },
  });
  container.appendChild(seekbar);

  const initialRemainingSec = isCounting ? pomodoroRemainingSec : phaseConfig.durationSec;
  const initialLabel = isCounting ? formatRemaining(pomodoroRemainingSec) : `${Math.round(phaseConfig.durationSec / 60)}分`;
  updateTimerSeekbar('pomodoro-timer-seekbar', initialRemainingSec, initialLabel);

  container.appendChild(el('div', { className: 'status-line', id: 'pomodoro-status', text: formatPomodoroStatus() }));

  const startButton = button(pomodoroState.runState === 'paused' ? '再開' : '開始', 'preset-button', () => post({ type: 'ui:pomodoroStart' }));
  startButton.disabled = sleepActive;

  container.appendChild(
    el('div', { className: 'preset-list' }, [
      startButton,
      button('一時停止', 'preset-button', () => post({ type: 'ui:pomodoroPause' })),
      button('リセット', 'preset-button', () => post({ type: 'ui:pomodoroReset' })),
      button('次のフェーズへ', 'preset-button', () => post({ type: 'ui:pomodoroSkipPhase' })),
    ]),
  );
  if (sleepActive) {
    container.appendChild(el('p', { className: 'timer-guard-note', text: 'スリープタイマー実行中は使用できません。' }));
  }
}

/** リスニング（スリープ）タイマーとポモドーロタイマーを1つの「タイマー」セクションにまとめ、
 * 共通のシークバーで表示・操作します。ON/OFF ボタンは表示モードの切替のみで、
 * ポモドーロ自体の開始/一時停止/リセットは別ボタンで行います。両方が同時に再生を制御すると
 * 分かりづらくなるため、一方が動作中はもう一方のシークバー操作・開始操作を無効化します。 */
export function renderTimerSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const pomodoroToggle = button(
    `ポモドーロ ${timerTab === 'pomodoro' ? 'ON' : 'OFF'}`,
    'pomodoro-toggle-button' + (timerTab === 'pomodoro' ? ' is-on' : ''),
    () => setTimerTab(timerTab === 'pomodoro' ? 'sleep' : 'pomodoro'),
  );
  const settingsButton = button('⚙', 'icon-button', openPomodoroSettings);
  const headerRow = el('div', { className: 'label-row' }, [
    el('h3', { text: 'タイマー' }),
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
