import './main.css';
import type { ExtToUiMessage } from '../../protocol';
import { strings } from './i18n';
import { handleExtMessage, pomodoroSettingsOpen, post, settings, setRenderCallback } from './state';
import { renderHeader, renderPresetEditor } from './views/header';
import { renderVolumeControl } from './views/controls';
import { renderBackgroundSection } from './views/background';
import { renderBeatSection } from './views/beat';
import { renderTimerSection } from './views/timer';
import { renderPomodoroSettingsModal } from './views/pomodoroSettings';

// このファイルは起動処理（render() の定義・登録、extension からのメッセージ配線）だけを担う
// オーケストレーターです。状態とアクションは state.ts、各セクションの描画は views/*.ts にあります。
function render(): void {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }
  if (!settings) {
    app.innerHTML = '';
    app.appendChild(Object.assign(document.createElement('p'), { className: 'loading', textContent: strings.loading }));
    return;
  }
  const s = settings;
  app.innerHTML = '';
  renderHeader(app, s);
  renderTimerSection(app, s);
  renderVolumeControl(app, s);
  renderBackgroundSection(app, s);
  renderBeatSection(app, s);
  renderPresetEditor(app, s);
  if (pomodoroSettingsOpen) {
    renderPomodoroSettingsModal(app, s);
  }
}

setRenderCallback(render);

window.addEventListener('message', (event: MessageEvent<ExtToUiMessage>) => handleExtMessage(event.data));

post({ type: 'ui:ready' });
