export function formatProgressBar(remainingSec: number, totalSec: number, segments = 10): string {
  if (totalSec <= 0) {
    return '░'.repeat(segments);
  }
  const elapsedRatio = 1 - remainingSec / totalSec;
  const filled = Math.max(0, Math.min(segments, Math.round(elapsedRatio * segments)));
  return '█'.repeat(filled) + '░'.repeat(segments - filled);
}

export function formatMMSS(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}
