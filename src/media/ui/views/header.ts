import type { BackgroundConfig, BeatConfig, WhiteNoiseSettings } from '../../../protocol';
import { bandForFrequency, noiseLabel } from '../constants';
import { button, el } from '../dom';
import {
  applyCurrentSettingsToPreset,
  playback,
  post,
  presetDescriptionDraft,
  presetIconDraft,
  presetNameDraft,
  resetAmbientPresets,
  selectedPresetId,
  selectPreset,
  setPresetDescriptionDraft,
  setPresetIconDraft,
  setPresetNameDraft,
} from '../state';

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

  const target = s.ambientPresets.find((preset) => preset.id === selectedPresetId);

  const select = el('select', { className: 'preset-select' });
  for (const preset of s.ambientPresets) {
    const label = `${preset.icon ?? ''} ${preset.name}`.trim();
    select.appendChild(new Option(label, preset.id, false, preset.id === selectedPresetId));
  }
  select.addEventListener('change', () => {
    const preset = s.ambientPresets.find((p) => p.id === select.value);
    if (!preset) return;
    selectPreset(s, preset);
  });

  const info = el('div', { className: 'current-preset-info' }, [
    select,
    el('span', { className: 'preset-setting-summary', text: buildPresetSummary(s.lastUsed) }),
  ]);

  const topRow = el('div', { className: 'header-top-row' }, [playButton, info]);
  const card = el('div', { className: 'header-row' }, [topRow]);

  if (target) {
    const iconInput = el('input', { className: 'preset-icon-input' });
    iconInput.type = 'text';
    iconInput.placeholder = 'アイコン';
    iconInput.value = presetIconDraft;
    iconInput.addEventListener('input', () => setPresetIconDraft(iconInput.value));

    const nameInput = el('input', { className: 'preset-name-input' });
    nameInput.type = 'text';
    nameInput.placeholder = '名前';
    nameInput.value = presetNameDraft;
    nameInput.addEventListener('input', () => setPresetNameDraft(nameInput.value));

    card.appendChild(el('div', { className: 'preset-name-icon-row' }, [iconInput, nameInput]));

    const descInput = el('textarea', { className: 'preset-description-input' });
    descInput.rows = 2;
    descInput.placeholder = '説明';
    descInput.value = presetDescriptionDraft;
    descInput.addEventListener('input', () => setPresetDescriptionDraft(descInput.value));
    card.appendChild(descInput);

    const resetButton = button('プリセットを既定に戻す', 'preset-reset-button', resetAmbientPresets);
    const applyButton = button('現在の設定をプリセットに適用', 'preset-apply-button', () => applyCurrentSettingsToPreset(s));
    card.appendChild(el('div', { className: 'preset-card-actions' }, [resetButton, applyButton]));
  }

  app.appendChild(card);
}
