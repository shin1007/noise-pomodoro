import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { NOISE_CHIPS } from '../constants';
import { post, selectedFileName, setBackground } from '../state';

function renderFileControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  const fileName = selectedFileName ?? s.lastUsed.background.file?.fsPath.split(/[\\/]/).pop();
  container.appendChild(el('p', { className: 'status-line', text: fileName ? `ファイル: ${fileName}` : 'ファイルが未選択です' }));
  container.appendChild(button(fileName ? 'ファイルを変更' : 'ファイルを選択', 'preset-button', () => post({ type: 'ui:selectAudioFile' })));
}

function renderCustomCodeControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  container.appendChild(el('p', { className: 'status-line', text: 't: 経過秒数, params: カスタムパラメータ。-1〜1 の値を return してください。' }));

  const textarea = el('textarea', { className: 'code-editor' });
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.value = s.lastUsed.background.custom?.code ?? '';
  container.appendChild(textarea);

  container.appendChild(
    button('適用', 'preset-button', () => {
      const code = textarea.value;
      const params = s.lastUsed.background.custom?.params ?? {};
      s.lastUsed.background = { mode: 'custom', custom: { code, params } };
      post({ type: 'ui:setCustomCode', code, params });
    }),
  );
}

export function renderBackgroundSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = el('div', { className: 'section' }, [el('h3', { text: '背景音' })]);

  const chips = el('div', { className: 'chip-row' });
  for (const chip of NOISE_CHIPS) {
    const isActive = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    chips.appendChild(button(chip.label, `noise-chip noise-${chip.key}` + (isActive ? ' selected' : ''), () => setBackground({ mode: 'procedural', noiseType: chip.key })));
  }
  chips.appendChild(button('オフ', 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : ''), () => setBackground({ mode: 'off' })));
  section.appendChild(chips);

  const fileButton = button('📁 音声ファイル', 'text-button' + (s.lastUsed.background.mode === 'file' ? ' selected' : ''), () => post({ type: 'ui:selectAudioFile' }));
  const customButton = button('🧪 カスタムコード', 'text-button' + (s.lastUsed.background.mode === 'custom' ? ' selected' : ''), () => {
    if (s.lastUsed.background.mode !== 'custom') {
      setBackground({ mode: 'custom', custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} } });
    }
  });
  section.appendChild(el('div', { className: 'chip-row' }, [fileButton, customButton]));

  if (s.lastUsed.background.mode === 'file') {
    renderFileControls(section, s);
  } else if (s.lastUsed.background.mode === 'custom') {
    renderCustomCodeControls(section, s);
  }

  app.appendChild(section);
}
