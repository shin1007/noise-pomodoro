import './main.css';
import type { ExtToUiMessage } from '../../protocol';
import { editingDraft, editingPresetId, handleExtMessage, post, settings, setRenderCallback } from './state';
import { renderHeader } from './views/header';
import { renderVolumeControl, renderTimerControl } from './views/controls';
import { renderBackgroundSection } from './views/background';
import { renderBeatSection } from './views/beat';
import { renderPresetsSection } from './views/presets';
import { renderPresetEditorModal } from './views/presetEditor';
import { renderPomodoroSection } from './views/pomodoro';

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
  renderVolumeControl(app, s);
  renderTimerControl(app);
  renderBackgroundSection(app, s);
  renderBeatSection(app, s);
  renderPresetsSection(app, s);
  renderPomodoroSection(app, s);
  if (editingPresetId && editingDraft) {
    renderPresetEditorModal(app, s);
  }
}

setRenderCallback(render);

window.addEventListener('message', (event: MessageEvent<ExtToUiMessage>) => handleExtMessage(event.data));

post({ type: 'ui:ready' });
