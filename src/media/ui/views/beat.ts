import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el, labelRow, rangeSlider, stepper } from '../dom';
import { BRAINWAVE_BANDS, bandForFrequency, findNearestSolfeggio, stepSolfeggioFrequency } from '../constants';
import { strings } from '../i18n';
import { setBeat, setBeatMode } from '../state';

export function renderBaseFrequencyControl(container: HTMLElement, s: WhiteNoiseSettings): void {
  const baseFreq = s.lastUsed.beat.baseFrequency;
  const { group } = stepper(
    `${baseFreq}Hz`,
    () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, -1) }),
    () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, 1) }),
  );

  // ソルフェジオ周波数へのスナップは離散的なため、ドラッグ中ではなく確定時 (change) に反映します。
  const slider = rangeSlider({
    min: 174,
    max: 963,
    step: 1,
    value: baseFreq,
    event: 'change',
    onChange: (value) => setBeat({ ...s.lastUsed.beat, baseFrequency: findNearestSolfeggio(value) }),
  });

  container.appendChild(el('div', { className: 'control-group' }, [labelRow(strings.beat.baseFrequencyLabel, group), slider]));
}

export function renderBeatSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = el('div', { className: 'section' }, [el('h3', { text: strings.beat.heading })]);

  section.appendChild(
    el('div', { className: 'mode-toggle-group' }, [
      button(strings.beat.binauralMode, 'mode-button' + (s.lastUsed.beatMode === 'binaural' ? ' active' : ''), () => setBeatMode('binaural')),
      button(strings.beat.isochronicMode, 'mode-button' + (s.lastUsed.beatMode === 'isochronic' ? ' active' : ''), () => setBeatMode('isochronic')),
    ]),
  );

  const bandRow = el('div', { className: 'chip-row' });
  for (const band of BRAINWAVE_BANDS) {
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    bandRow.appendChild(
      button(`${band.symbol} ${strings.brainwaveBands[band.key]}`, 'band-chip' + (isSelected ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz })),
    );
  }
  bandRow.appendChild(button(strings.common.off, 'band-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: false })));
  section.appendChild(bandRow);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(section, s);
  }

  app.appendChild(section);
}
