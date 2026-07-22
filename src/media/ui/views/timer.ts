import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { strings } from '../i18n';
import {
  clearListenTimer,
  formatRemaining,
  listenTimerMinutes,
  listenTimerRemainingSec,
  openPomodoroSettings,
  pomodoroRemainingSec,
  pomodoroState,
  post,
  reclaimListenTimerFromPomodoro,
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
    interactive: true,
    onSetMinutes: (minutes) => {
      // ポモドーロ実行中/一時停止中にダイヤルを動かしたら、そちらを打ち切ってスリープタイマーに
      // 制御を戻します（ポモドーロの開始ボタン側の取り扱いと対称）。
      if (pomodoroActive) {
        setListenTimerMinutes(minutes);
        updateTimerSeekbar('sleep-timer-seekbar', minutes * 60, minutes === 0 ? strings.timer.none : strings.timer.minutesUnit(minutes));
        reclaimListenTimerFromPomodoro();
        return;
      }
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
}

function renderPomodoroTab(container: HTMLElement, s: WhiteNoiseSettings): void {
  const sleepActive = listenTimerRemainingSec !== null;
  const isCounting = pomodoroState.runState !== 'stopped';
  // idle 中にダイヤルで編集する対象は、次に開始したときに使われる集中/休憩フェーズです。
  const activePhase: 'focus' | 'break' = pomodoroState.phase === 'break' ? 'break' : 'focus';
  const phaseConfig = s.pomodoro[activePhase];

  const seekbar = createTimerSeekbar('pomodoro-timer-seekbar', {
    interactive: true,
    onSetMinutes: (minutes) => {
      // スリープタイマー動作中にダイヤルを動かしたら、そちらを打ち切ります
      // （スリープタブ側のダイヤルの取り扱いと対称）。
      if (sleepActive) {
        clearListenTimer();
      }
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
}

/** 開始/一時停止/リセット/次のフェーズの再生系ボタンです。タイマーセクションのヘッダー行、
 * ポモドーロON/OFFトグルの左側に置くため、タブ切り替えとは独立してここで組み立てます。
 * 実行中/一時停止中かは文言ではなくボタンの色（is-active）で示します。一時停止・開始ボタンは
 * id を振っており、毎秒の ext:pomodoroTick では state.ts がこの id を直接 DOM パッチして
 * is-active を切り替えます（この関数自体は tick では呼ばれないため）。 */
function createPomodoroTransportButtons(): HTMLElement[] {
  const isRunning = pomodoroState.runState === 'running';
  const isPaused = pomodoroState.runState === 'paused';

  const resetButton = button('◀◀', 'transport-button', () => post({ type: 'ui:pomodoroReset' }));
  resetButton.title = strings.timer.reset;

  const pauseButton = button('■■', 'transport-button' + (isPaused ? ' is-active' : ''), () => post({ type: 'ui:pomodoroPause' }));
  pauseButton.id = 'pomodoro-pause-button';
  pauseButton.title = strings.timer.pause;

  // スリープタイマー動作中に開始を押した場合は、そのままではフェーズ開始で
  // スリープタイマー側が生き残ってしまう（handlePlaybackUpdate 参照）ため、先に打ち切ります。
  const startButton = button('▶', 'transport-button' + (isRunning ? ' is-active' : ''), () => {
    if (listenTimerRemainingSec !== null) {
      clearListenTimer();
    }
    post({ type: 'ui:pomodoroStart' });
  });
  startButton.id = 'pomodoro-start-button';
  startButton.title = isPaused ? strings.timer.resume : strings.timer.start;

  const skipButton = button('▶▶', 'transport-button', () => post({ type: 'ui:pomodoroSkipPhase' }));
  skipButton.title = strings.timer.skipPhase;

  return [resetButton, pauseButton, startButton, skipButton];
}

/** リスニング（スリープ）タイマーとポモドーロタイマーを1つの「タイマー」セクションにまとめ、
 * 共通のシークバーで表示・操作します。ON/OFF ボタンは表示モードの切替のみで、
 * ポモドーロ自体の開始/一時停止/リセットは別ボタンで行います。両方が同時に再生を制御すると
 * 分かりづらくなるため排他的に運用しますが、操作をブロックするのではなく、片方を操作したら
 * もう片方を打ち切って制御を明け渡す方式にしています（createPomodoroTransportButtons の
 * 開始ボタン、renderSleepTab/renderPomodoroTab 各ダイヤルの onSetMinutes を参照）。 */
export function renderTimerSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const pomodoroToggle = button(
    strings.timer.pomodoroToggle(timerTab === 'pomodoro'),
    'pomodoro-toggle-button' + (timerTab === 'pomodoro' ? ' is-on' : ''),
    () => setTimerTab(timerTab === 'pomodoro' ? 'sleep' : 'pomodoro'),
  );
  const settingsButton = button('⚙', 'icon-button', openPomodoroSettings);
  const actions = timerTab === 'pomodoro' ? [...createPomodoroTransportButtons(), pomodoroToggle, settingsButton] : [pomodoroToggle, settingsButton];
  const headerRow = el('div', { className: 'label-row' }, [
    el('h3', { text: strings.timer.heading }),
    el('div', { className: 'timer-header-actions' }, actions),
  ]);
  const section = el('div', { className: 'section' }, [headerRow]);
  // シークバー生成直後に updateTimerSeekbar() で初期値を書き込むため（id 経由の
  // document.getElementById）、中身を詰める前に app へ接続します。未接続のまま
  // 詰めると getElementById が見つけられず、初期値の書き込みが無音で失敗します。
  app.appendChild(section);

  if (timerTab === 'sleep') {
    renderSleepTab(section);
  } else {
    renderPomodoroTab(section, s);
  }
}
