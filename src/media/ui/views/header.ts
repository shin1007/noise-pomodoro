import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { playback, post } from '../state';
import { buildPresetSummary } from './presets';

export function renderHeader(app: HTMLElement, s: WhiteNoiseSettings): void {
  const playButton = button(
    playback.status === 'playing' ? '■' : '▶',
    'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : ''),
    () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }),
  );

  const activePreset = s.ambientPresets.find((preset) => preset.id === s.lastUsed.activePresetId);
  const presetName = activePreset ? `${activePreset.icon ?? ''} ${activePreset.name}`.trim() : 'カスタム設定';

  const info = el('div', { className: 'current-preset-info' }, [
    el('strong', { className: 'current-preset-name', text: presetName }),
    el('span', { className: 'preset-setting-summary', text: buildPresetSummary(s.lastUsed) }),
  ]);

  app.appendChild(el('div', { className: 'header-row' }, [playButton, info]));
}
