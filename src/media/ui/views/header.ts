import type { BackgroundConfig, BeatConfig, WhiteNoiseSettings } from '../../../protocol';
import { bandForFrequency, noiseLabel } from '../constants';
import { button, el } from '../dom';
import { applyPresetLocally, openPresetEditor, playback, post, requestRender } from '../state';

/** ヘッダーの現在設定表示に使う「背景音 + ビート」の一行サマリーです。 */
function buildPresetSummary(config: { background: BackgroundConfig; beat: BeatConfig }): string {
  const bgLabel =
    config.background.mode === 'off'
      ? 'ノイズなし'
      : config.background.mode === 'procedural' && config.background.noiseType
        ? noiseLabel(config.background.noiseType)
        : config.background.mode === 'file'
          ? 'ファイル'
          : 'カスタム';
  if (!config.beat.enabled) {
    return bgLabel;
  }
  const band = bandForFrequency(config.beat.beatFrequency);
  return `${bgLabel} · ${config.beat.baseFrequency}Hz (${band.label}${band.symbol})`;
}

export function renderHeader(app: HTMLElement, s: WhiteNoiseSettings): void {
  const playButton = button(
    playback.status === 'playing' ? '■' : '▶',
    'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : ''),
    () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }),
  );

  const activePresetId = s.lastUsed.activePresetId;
  const activePreset = s.ambientPresets.find((preset) => preset.id === activePresetId);

  const select = el('select', { className: 'preset-select' });
  if (!activePreset) {
    const customOption = new Option('カスタム設定', '', true, true);
    customOption.disabled = true;
    select.appendChild(customOption);
  }
  for (const preset of s.ambientPresets) {
    const label = `${preset.icon ?? ''} ${preset.name}`.trim();
    select.appendChild(new Option(label, preset.id, false, preset.id === activePresetId));
  }
  select.addEventListener('change', () => {
    const preset = s.ambientPresets.find((p) => p.id === select.value);
    if (!preset) return;
    post({ type: 'ui:applyPreset', presetId: preset.id });
    applyPresetLocally(s, preset);
    requestRender();
  });

  const info = el('div', { className: 'current-preset-info' }, [
    select,
    el('span', { className: 'preset-setting-summary', text: buildPresetSummary(s.lastUsed) }),
  ]);

  const topRowChildren = [playButton, info];
  if (activePreset) {
    topRowChildren.push(button('編集', 'preset-edit-button', () => openPresetEditor(activePreset)));
  }
  const topRow = el('div', { className: 'header-top-row' }, topRowChildren);

  const card = el('div', { className: 'header-row' }, [topRow]);
  if (activePreset?.description) {
    card.appendChild(el('p', { className: 'preset-description', text: activePreset.description }));
  }
  app.appendChild(card);
}
