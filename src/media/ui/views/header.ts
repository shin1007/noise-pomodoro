import type { WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { bandForFrequency } from '../constants';
import { playback, post } from '../state';

export function renderHeader(app: HTMLElement, s: WhiteNoiseSettings): void {
  const playButton = button(
    playback.status === 'playing' ? '■' : '▶',
    'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : ''),
    () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }),
  );

  const children: HTMLElement[] = [playButton, el('h2', { className: 'app-title', text: 'White Noise' })];
  if (s.lastUsed.beat.enabled) {
    children.push(el('span', { className: 'wave-symbol', text: bandForFrequency(s.lastUsed.beat.beatFrequency).symbol }));
  }
  app.appendChild(el('div', { className: 'header-row' }, children));
}
