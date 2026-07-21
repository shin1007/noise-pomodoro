import './main.css';
import type { ExtToUiMessage } from '../../protocol';
import { editingDraft, editingPresetId, handleExtMessage, pomodoroSettingsOpen, post, settings, setRenderCallback } from './state';
import { renderHeader } from './views/header';
import { renderVolumeControl } from './views/controls';
import { renderBackgroundSection } from './views/background';
import { renderBeatSection } from './views/beat';
import { renderPresetEditorModal } from './views/presetEditor';
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
    app.innerHTML = '<p class="loading">Loading…</p>';
    return;
  }
  const s = settings;
  app.innerHTML = '';
  renderHeader(app, s);
  renderTimerSection(app, s);
  renderVolumeControl(app, s);
  renderBackgroundSection(app, s);
  renderBeatSection(app, s);
  if (editingPresetId && editingDraft) {
    renderPresetEditorModal(app, s);
  }
  if (pomodoroSettingsOpen) {
    renderPomodoroSettingsModal(app, s);
  }
}

setRenderCallback(render);

window.addEventListener('message', (event: MessageEvent<ExtToUiMessage>) => handleExtMessage(event.data));

post({ type: 'ui:ready' });
