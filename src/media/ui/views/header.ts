import type { BackgroundConfig, BeatConfig, NoisePomodoroSettings } from '../../../protocol';
import { bandForFrequency } from '../constants';
import { button, el } from '../dom';
import { strings } from '../i18n';
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
      ? strings.header.noNoise
      : config.background.mode === 'procedural' && config.background.noiseType
        ? strings.noiseTypes[config.background.noiseType]
        : config.background.mode === 'file'
          ? strings.header.fileBackgroundLabel
          : strings.header.customBackgroundLabel;
  if (!config.beat.enabled) {
    return bgLabel;
  }
  const band = bandForFrequency(config.beat.beatFrequency);
  return `${bgLabel} · ${config.beat.baseFrequency}Hz (${strings.brainwaveBands[band.key]}${band.symbol})`;
}

export function renderHeader(app: HTMLElement, s: NoisePomodoroSettings): void {
  const playButton = button(
    playback.status === 'playing' ? '■' : '▶',
    'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : ''),
    () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }),
  );

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

  const target = s.ambientPresets.find((preset) => preset.id === selectedPresetId);

  const infoChildren = [select, el('span', { className: 'preset-setting-summary', text: buildPresetSummary(s.lastUsed) })];
  if (target?.description) {
    infoChildren.push(el('span', { className: 'preset-description-line', text: target.description }));
  }
  const info = el('div', { className: 'current-preset-info' }, infoChildren);

  const topRow = el('div', { className: 'header-top-row' }, [playButton, info]);
  const card = el('div', { className: 'header-row' }, [topRow]);

  app.appendChild(card);
}

/** 選択中プリセットのアイコン・名前・説明の編集と、既定へのリセット/現在設定の適用を行うカードです。
 * ヘッダーの再生行から分離し、ページ最下部に配置しています。 */
export function renderPresetEditor(app: HTMLElement, s: NoisePomodoroSettings): void {
  const target = s.ambientPresets.find((preset) => preset.id === selectedPresetId);
  if (!target) {
    return;
  }

  const iconInput = el('input', { className: 'preset-icon-input' });
  iconInput.type = 'text';
  iconInput.placeholder = strings.header.iconPlaceholder;
  iconInput.value = presetIconDraft;
  iconInput.addEventListener('input', () => setPresetIconDraft(iconInput.value));

  const nameInput = el('input', { className: 'preset-name-input' });
  nameInput.type = 'text';
  nameInput.placeholder = strings.header.namePlaceholder;
  nameInput.value = presetNameDraft;
  nameInput.addEventListener('input', () => setPresetNameDraft(nameInput.value));

  const descInput = el('textarea', { className: 'preset-description-input' });
  descInput.rows = 2;
  descInput.placeholder = strings.header.descriptionPlaceholder;
  descInput.value = presetDescriptionDraft;
  descInput.addEventListener('input', () => setPresetDescriptionDraft(descInput.value));

  const resetButton = button(strings.header.resetPresetsButton, 'preset-reset-button', resetAmbientPresets);
  const applyButton = button(strings.header.applyToPresetButton, 'preset-apply-button', () => applyCurrentSettingsToPreset(s));

  const card = el('div', { className: 'header-row' }, [
    el('div', { className: 'preset-name-icon-row' }, [iconInput, nameInput]),
    descInput,
    el('div', { className: 'preset-card-actions' }, [resetButton, applyButton]),
  ]);

  app.appendChild(card);
}
