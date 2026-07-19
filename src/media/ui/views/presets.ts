import type { AmbientPreset, WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { bandForFrequency, noiseLabel } from '../constants';
import { applyPresetLocally, openPresetEditor, post, requestRender } from '../state';

function buildPresetSummary(preset: AmbientPreset): string {
  const bgLabel =
    preset.background.mode === 'off'
      ? 'ノイズなし'
      : preset.background.mode === 'procedural' && preset.background.noiseType
        ? noiseLabel(preset.background.noiseType)
        : preset.background.mode === 'file'
          ? 'ファイル'
          : 'カスタム';
  if (!preset.beat.enabled) {
    return bgLabel;
  }
  const band = bandForFrequency(preset.beat.beatFrequency);
  return `${bgLabel} · ${preset.beat.baseFrequency}Hz (${band.label}${band.symbol})`;
}

function renderPresetCard(s: WhiteNoiseSettings, preset: AmbientPreset): HTMLDivElement {
  const card = el('div', { className: 'preset-card' + (s.lastUsed.activePresetId === preset.id ? ' active' : '') });
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const editButton = button('編集', 'preset-edit-button', (event) => {
    event.stopPropagation();
    openPresetEditor(preset);
  });
  const titleRow = el('div', { className: 'preset-card-title-row' }, [el('strong', { text: `${preset.icon ?? ''} ${preset.name}`.trim() }), editButton]);
  card.appendChild(el('div', { className: 'preset-card-head' }, [titleRow, el('span', { className: 'preset-setting-summary', text: buildPresetSummary(preset) })]));

  if (preset.description) {
    card.appendChild(el('p', { className: 'preset-description-readonly', text: preset.description }));
  }

  const activate = () => {
    post({ type: 'ui:applyPreset', presetId: preset.id });
    applyPresetLocally(s, preset);
    requestRender();
  };
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
  return card;
}

export function renderPresetsSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const list = el('div', { className: 'preset-list' });
  for (const preset of s.ambientPresets) {
    list.appendChild(renderPresetCard(s, preset));
  }

  app.appendChild(
    el('div', { className: 'section presets-section' }, [
      el('h3', { className: 'section-title', text: 'プリセット' }),
      list,
      button('プリセットをリセット', 'preset-reset-button', () => post({ type: 'ui:resetPresets' })),
    ]),
  );
}
