// Webview UI (ui/main.ts) の DOM 組み立てを、少数の小さなヘルパーに集約します。
// これらは「createElement → クラス/文言/id 設定 → 子要素追加 → イベント登録」という、
// UI 全体で何十回も現れる定型を 1 か所にまとめ、各 render 関数を「どんな要素を、どの順で
// 置くか」の記述だけに集中させるためのものです。document / HTMLElement に依存するため、
// Webview バンドル専用です（extension host からは import しないでください）。

interface ElOptions {
  className?: string;
  /** textContent。設定後に children を追加するため、文言＋子要素の併用も安全です。 */
  text?: string;
  id?: string;
}

/** createElement と className / textContent / id 設定、子要素追加をまとめた汎用ヘルパーです。 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className !== undefined) {
    node.className = options.className;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  if (options.id !== undefined) {
    node.id = options.id;
  }
  for (const child of children) {
    node.appendChild(child);
  }
  return node;
}

/** type="button" のボタンを、文言・クラス・click ハンドラだけ指定して生成します。 */
export function button(text: string, className: string, onClick: (event: MouseEvent) => void): HTMLButtonElement {
  const node = el('button', { text, className });
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

/**
 * 「- [値] +」形式のステッパー（.value-with-stepper）を生成します。値表示は返り値の value から
 * 直接書き換えられるため、全体を render() し直さずその場で数値を更新する呼び出し側にも対応します。
 * （増減時に render() で作り直す呼び出し側は group だけ使えば十分です。）
 */
export function stepper(
  valueText: string,
  onDecrement: () => void,
  onIncrement: () => void,
): { group: HTMLDivElement; value: HTMLSpanElement } {
  const value = el('span', { className: 'value-display', text: valueText });
  const group = el('div', { className: 'value-with-stepper' }, [
    button('-', 'step-button', onDecrement),
    value,
    button('+', 'step-button', onIncrement),
  ]);
  return { group, value };
}

/** .label-row（左に .label-text、右に任意のトレーリング要素）を生成します。 */
export function labelRow(text: string, trailing?: Node): HTMLDivElement {
  const row = el('div', { className: 'label-row' }, [el('span', { className: 'label-text', text })]);
  if (trailing) {
    row.appendChild(trailing);
  }
  return row;
}

/** range スライダーを、属性と変更ハンドラだけ指定して生成します（event は 'input' か 'change'）。 */
export function rangeSlider(opts: {
  min: number;
  max: number;
  step: number;
  value: number;
  event: 'input' | 'change';
  onChange: (value: number) => void;
}): HTMLInputElement {
  const input = el('input');
  input.type = 'range';
  input.min = String(opts.min);
  input.max = String(opts.max);
  input.step = String(opts.step);
  input.value = String(opts.value);
  input.addEventListener(opts.event, () => opts.onChange(Number(input.value)));
  return input;
}
