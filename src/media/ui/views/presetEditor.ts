import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el, labelRow, stepper } from '../dom';
import { BRAINWAVE_BANDS, NOISE_CHIPS, bandForFrequency } from '../constants';
import { cancelPresetEditor, editingDraft, previewPresetVolume, saveEditingPreset, setBackground, setBeat } from '../state';
import { renderBaseFrequencyControl } from './beat';

function renderLabeledInput(labelText: string, input: HTMLElement): HTMLLabelElement {
  return el('label', {}, [labelRow(labelText), input]);
}

export function renderPresetEditorModal(app: HTMLElement, s: WhiteNoiseSettings): void {
  if (!editingDraft) return;
  const draft = editingDraft;

  const body = el('div', { className: 'modal-body preset-editor-body' });

  const nameInput = el('input', { className: 'preset-name-input' });
  nameInput.value = draft.name;
  nameInput.addEventListener('input', () => {
    draft.name = nameInput.value;
  });
  body.appendChild(renderLabeledInput('プリセット名', nameInput));

  const descInput = el('textarea', { className: 'preset-description-input' });
  descInput.rows = 2;
  descInput.value = draft.description;
  descInput.addEventListener('input', () => {
    draft.description = descInput.value;
  });
  body.appendChild(renderLabeledInput('説明', descInput));

  body.appendChild(el('div', { className: 'preset-control-label', text: '背景音' }));
  const bgGrid = el('div', { className: 'noise-grid preset-noise-grid' });
  for (const chip of NOISE_CHIPS) {
    const isSelected = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    bgGrid.appendChild(button(chip.label, `noise-chip noise-${chip.key}` + (isSelected ? ' selected' : ''), () => setBackground({ mode: 'procedural', noiseType: chip.key })));
  }
  bgGrid.appendChild(button('オフ', 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : ''), () => setBackground({ mode: 'off' })));
  body.appendChild(bgGrid);

  body.appendChild(el('div', { className: 'preset-control-label', text: 'ビート' }));
  const beatGrid = el('div', { className: 'noise-grid preset-noise-grid preset-beat-grid' });
  for (const band of BRAINWAVE_BANDS) {
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    beatGrid.appendChild(button(`${band.label}波 (${band.targetHz}Hz)`, 'noise-chip' + (isSelected ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz })));
  }
  beatGrid.appendChild(button('オフ', 'noise-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: false })));
  body.appendChild(beatGrid);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(body, s);
  }

  const { group: volStepper } = stepper(
    `${Math.round(s.lastUsed.masterVolume * 100)}%`,
    () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) - 1),
    () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) + 1),
  );
  body.appendChild(el('div', { className: 'control-group preset-control-group' }, [labelRow('音量', volStepper)]));

  body.appendChild(el('div', { className: 'preset-card-actions' }, [button('適用して保存', 'preset-apply-button', saveEditingPreset)]));

  const header = el('div', { className: 'modal-header' }, [el('h2', { text: 'プリセット編集' }), button('×', 'close-modal', cancelPresetEditor)]);
  const modal = el('div', { className: 'modal-content preset-editor-modal' }, [header, body]);
  modal.addEventListener('click', (event) => event.stopPropagation());

  const overlay = el('div', { className: 'modal-overlay' }, [modal]);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      cancelPresetEditor();
    }
  });
  app.appendChild(overlay);
}
