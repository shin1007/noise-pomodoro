import type { EngineToExtMessage, ExtToEngineMessage, NoiseType, ResolvedLiveMix } from '../../protocol';
import type { WorkletInMessage, WorkletOutMessage } from '../../audioEngine/worklets/messages';
import { getVsCodeApi } from '../vscodeApi';
import { beatParamKey, mixLevels, paramsEqual, safeFrequency, safeGain } from './mixParams';

declare global {
  interface Window {
    __WORKLET_URI__: string;
  }
}

// UI (ui/main.ts) と同じ Webview ドキュメントに同居するための共有 vscode API 取得は
// vscodeApi.ts に集約しています。ここでは EngineToExtMessage 専用の post に薄く包みます。
const vscode = getVsCodeApi();

function post(message: EngineToExtMessage): void {
  vscode.postMessage(message);
}

const GAIN_SMOOTHING_SEC = 0.05;

let audioContext: AudioContext | undefined;
let masterGain: GainNode | undefined;
let backgroundGain: GainNode | undefined;
let beatGain: GainNode | undefined;
// フェーズ終了チャイム等の one-shot 再生専用のゲインです。masterGain は非再生時に 0 のため、
// そこへ繋ぐと「再生していない間はチャイムが無音になる」問題が起きます。destination へ直結し、
// アンビエント再生の有無に関係なく一定音量で鳴らせます。音量は各ノードの gain（extension.ts が
// settings.audioOutputScale を織り込み済みの preset.volume）で決まるため、ここは常に 1 で中立です。
let oneShotGain: GainNode | undefined;

// 背景音レイヤー（ノイズ / ファイル / カスタムコード。排他的に 1 つだけ有効）
type BackgroundKind = 'off' | 'noise' | 'file' | 'custom';
let backgroundNode: AudioWorkletNode | undefined;
let backgroundKind: BackgroundKind = 'off';
let fileSource: AudioBufferSourceNode | undefined;
let fileGain: GainNode | undefined;
let currentFileFsPath: string | undefined;
// noise/custom は eng:play のたびに再送しがちなため（音量変更だけでも呼ばれる）、
// 直近に実際に送った値を覚えておき、変化がなければ再送しません。特にカスタムコードは
// worklet 側で new Function による再コンパイルが走るため、無関係な操作のたびに再送すると
// リアルタイムオーディオスレッドの処理落ち（音切れ）を招きます。
let currentNoiseType: NoiseType | undefined;
let currentCustomCode: string | undefined;
let currentCustomParams: Record<string, number> | undefined;

// ビートレイヤー（バイノーラル / アイソクロニック。背景音とは独立して有効・無効を切り替えます）
let beatNode: AudioWorkletNode | undefined;

// applyMix / handleStop はどちらも decodeAudioData や resume() の await をまたぐため、
// eng:play の連打や再生中の stop が重なると、古い非同期処理が後から完了してグラフを壊す
// （ノードのリーク・二重再生・停止後に音が復活）恐れがあります。状態を変える操作ごとに
// この世代番号を進め、await から戻った時点で最新でなければ処理を破棄することで、
// 常に「最後の操作」だけがオーディオグラフに反映されるようにします。
let mixEpoch = 0;

// OS 側の音声セッション中断・出力デバイス切り替え・スリープ復帰などで AudioContext が
// こちらの意図と無関係に suspended へ落ちることがあります。何もしないと次にユーザーが
// 何か操作するまで無音のままになるため、「今は再生中であるべきか」をここで覚えておき、
// statechange で自動的に resume() します（初回の resume() と違い、一度でもユーザー操作
// 経由の resume() に成功していればこの自動再開はブラウザにブロックされません）。
let shouldBePlaying = false;

/**
 * AudioContext の生成と AudioWorklet の読み込みだけを行います。resume() は呼びません。
 * ブラウザの自動再生ポリシーでは、ユーザー操作を伴わずに呼んだ resume() は永久に
 * 解決しない Promise を返すため、ページ読み込み直後の事前初期化ではここまでに留めます。
 */
async function ensureAudioContext(): Promise<AudioContext> {
  if (audioContext) {
    return audioContext;
  }
  audioContext = new AudioContext();
  audioContext.addEventListener('statechange', () => {
    if (audioContext?.state === 'suspended' && shouldBePlaying) {
      void audioContext.resume();
    }
  });
  await audioContext.audioWorklet.addModule(window.__WORKLET_URI__);
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);
  backgroundGain = audioContext.createGain();
  backgroundGain.gain.value = 0;
  backgroundGain.connect(masterGain);
  beatGain = audioContext.createGain();
  beatGain.gain.value = 0;
  beatGain.connect(masterGain);
  oneShotGain = audioContext.createGain();
  oneShotGain.gain.value = 1;
  oneShotGain.connect(audioContext.destination);
  return audioContext;
}

/**
 * 実際に再生を始める直前に呼びます。eng:play などのメッセージはユーザーのクリックに
 * 起因して届くため、この時点での resume() はユーザー操作の文脈内とみなされます。
 */
async function ensureRunningAudioContext(): Promise<AudioContext> {
  const ctx = await ensureAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}

function attachErrorReporting(node: AudioWorkletNode, layer: 'background' | 'beat'): void {
  node.port.onmessage = (event: MessageEvent<WorkletOutMessage>) => {
    if (event.data.type === 'customCodeError') {
      post({ type: 'eng:playbackError', layer, message: event.data.message });
    }
  };
}

function teardownBackground(): void {
  if (backgroundNode) {
    backgroundNode.port.onmessage = null;
    backgroundNode.disconnect();
    backgroundNode = undefined;
  }
  if (fileSource) {
    fileSource.onended = null;
    try {
      fileSource.stop();
    } catch {
      // すでに停止済み / 終了済みの場合は無視します。
    }
    fileSource.disconnect();
    fileSource = undefined;
  }
  fileGain?.disconnect();
  fileGain = undefined;
  currentFileFsPath = undefined;
  currentNoiseType = undefined;
  currentCustomCode = undefined;
  currentCustomParams = undefined;
  backgroundKind = 'off';
}

function teardownBeat(): void {
  if (beatNode) {
    beatNode.port.onmessage = null;
    beatNode.disconnect();
    beatNode = undefined;
  }
}

async function applyBackground(mix: ResolvedLiveMix, epoch: number): Promise<void> {
  const { background } = mix;
  const targetKind: BackgroundKind =
    background.mode === 'procedural' ? 'noise' : background.mode === 'file' ? 'file' : background.mode === 'custom' ? 'custom' : 'off';

  if (targetKind === 'file') {
    // ファイルパスが変わっていなければ何もしません（再デコード・再生成による
    // 途切れを避けるため）。extension.ts 側は変化がない限り fileBytes を省略します。
    if (backgroundKind === 'file' && background.file?.fsPath === currentFileFsPath) {
      return;
    }
    if (!background.fileBytes) {
      throw new Error('No audio file data received.');
    }
    const ctx = audioContext!;
    const bytes = background.fileBytes;
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer as ArrayBuffer);
    if (epoch !== mixEpoch) {
      // デコード中に別の再生・停止が割り込みました。デコード済みバッファは捨て、
      // オーディオグラフには一切触れずに戻ります（古い音を後から鳴らさないため）。
      return;
    }

    teardownBackground();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = background.file?.loop ?? true;
    fileGain = ctx.createGain();
    fileGain.gain.value = 1;
    source.connect(fileGain);
    fileGain.connect(backgroundGain!);
    source.onended = () => {
      if (fileSource === source) {
        fileSource = undefined;
        backgroundKind = 'off';
        post({ type: 'eng:backgroundEnded' });
      }
    };
    source.start(0);
    fileSource = source;
    currentFileFsPath = background.file?.fsPath;
    backgroundKind = 'file';
    return;
  }

  if (backgroundKind !== targetKind) {
    teardownBackground();
    if (targetKind === 'noise') {
      backgroundNode = new AudioWorkletNode(audioContext!, 'noise-processor', { outputChannelCount: [2] });
      backgroundNode.connect(backgroundGain!);
      postToNode(backgroundNode, { type: 'setVolume', value: 1 });
    } else if (targetKind === 'custom') {
      backgroundNode = new AudioWorkletNode(audioContext!, 'custom-code-processor', { outputChannelCount: [2] });
      backgroundNode.connect(backgroundGain!);
      attachErrorReporting(backgroundNode, 'background');
      postToNode(backgroundNode, { type: 'setVolume', value: 1 });
    }
    backgroundKind = targetKind;
  }

  if (targetKind === 'noise' && background.noiseType) {
    if (background.noiseType !== currentNoiseType) {
      postToNode(backgroundNode, { type: 'setNoiseType', value: background.noiseType });
      currentNoiseType = background.noiseType;
    }
  } else if (targetKind === 'custom' && background.custom) {
    const { code, params } = background.custom;
    if (code !== currentCustomCode || !currentCustomParams || !paramsEqual(params, currentCustomParams)) {
      postToNode(backgroundNode, { type: 'setCustomCode', code, params });
      currentCustomCode = code;
      currentCustomParams = params;
    }
  }
}

function applyBeat(mix: ResolvedLiveMix): void {
  const { beat, beatMode } = mix;
  if (!beat.enabled) {
    teardownBeat();
    return;
  }

  if (!beatNode) {
    beatNode = new AudioWorkletNode(audioContext!, 'tone-processor', { outputChannelCount: [2] });
    beatNode.connect(beatGain!);
    postToNode(beatNode, { type: 'setVolume', value: 1 });
  }

  postToNode(beatNode, { type: 'setToneType', value: beatMode });
  postToNode(beatNode, { type: 'setParam', key: 'carrierFreq', value: safeFrequency(beat.baseFrequency, 528) });
  postToNode(beatNode, { type: 'setParam', key: beatParamKey(beatMode), value: safeFrequency(beat.beatFrequency, 10) });
}

function postToNode(node: AudioWorkletNode | undefined, message: WorkletInMessage): void {
  node?.port.postMessage(message);
}

async function applyMix(mix: ResolvedLiveMix): Promise<void> {
  const epoch = ++mixEpoch;
  const ctx = await ensureRunningAudioContext();
  if (epoch !== mixEpoch) {
    return;
  }

  try {
    await applyBackground(mix, epoch);
  } catch (err) {
    if (epoch === mixEpoch) {
      post({ type: 'eng:playbackError', layer: 'background', message: (err as Error).message });
    }
  }
  // 背景音の適用中（デコード）に stop や別の play が割り込んでいたら、ビートやゲインには触れません。
  if (epoch !== mixEpoch) {
    return;
  }

  try {
    applyBeat(mix);
  } catch (err) {
    post({ type: 'eng:playbackError', layer: 'beat', message: (err as Error).message });
  }

  const { backgroundLevel, beatLevel } = mixLevels(mix.beat.enabled);
  backgroundGain!.gain.setTargetAtTime(backgroundLevel, ctx.currentTime, GAIN_SMOOTHING_SEC);
  beatGain!.gain.setTargetAtTime(beatLevel, ctx.currentTime, GAIN_SMOOTHING_SEC);
  masterGain!.gain.setTargetAtTime(safeGain(mix.volume), ctx.currentTime, GAIN_SMOOTHING_SEC);

  shouldBePlaying = true;
  post({ type: 'eng:playbackStarted' });
}

async function handleStop(): Promise<void> {
  // 世代番号を進め、デコード待ちなどで宙に浮いている applyMix があれば無効化します。
  const epoch = ++mixEpoch;
  shouldBePlaying = false;
  if (audioContext && masterGain) {
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, GAIN_SMOOTHING_SEC);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  // フェード待ちの間に新しい再生が始まっていたら、その再生を尊重してノードを破棄しません
  // （破棄すると始まったばかりの音が即座に消えてしまうため）。
  if (epoch !== mixEpoch) {
    return;
  }
  teardownBackground();
  teardownBeat();
}

const ONE_SHOT_MAX_MS = 3000;

/**
 * フェーズ終了時の短い通知音を、背景音・ビートの再生とは別ノードで鳴らします。
 * それらの再生を止めずに重ねられるよう、また非再生時（masterGainが0）でも鳴るよう、
 * masterGainではなく専用のoneShotGainへ直接つなぎます。
 */
async function handlePlayOneShot(preset: Extract<ExtToEngineMessage, { type: 'eng:playOneShot' }>['preset']): Promise<void> {
  const ctx = await ensureRunningAudioContext();

  if (preset.mode === 'file' && preset.fileBytes) {
    try {
      const bytes = preset.fileBytes;
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer as ArrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false;
      const gain = ctx.createGain();
      gain.gain.value = safeGain(preset.volume);
      source.connect(gain);
      gain.connect(oneShotGain!);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      source.start(0);
    } catch (err) {
      post({ type: 'eng:playbackError', layer: 'background', message: `Failed to play end sound: ${(err as Error).message}` });
    }
    return;
  }

  if (preset.mode === 'custom' && preset.custom) {
    const node = new AudioWorkletNode(ctx, 'custom-code-processor', { outputChannelCount: [2] });
    node.connect(oneShotGain!);
    node.port.postMessage({ type: 'setCustomCode', code: preset.custom.code, params: preset.custom.params } satisfies WorkletInMessage);
    node.port.postMessage({ type: 'setVolume', value: preset.volume } satisfies WorkletInMessage);
    setTimeout(() => node.disconnect(), ONE_SHOT_MAX_MS);
    return;
  }

  if (preset.mode === 'procedural' && preset.procedural) {
    const node = new AudioWorkletNode(ctx, 'noise-processor', { outputChannelCount: [2] });
    node.connect(oneShotGain!);
    node.port.postMessage({ type: 'setNoiseType', value: preset.procedural.algorithm } satisfies WorkletInMessage);
    node.port.postMessage({ type: 'setVolume', value: preset.volume } satisfies WorkletInMessage);
    setTimeout(() => node.disconnect(), ONE_SHOT_MAX_MS);
  }
}

window.addEventListener('message', (event: MessageEvent<ExtToEngineMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'eng:play':
      void applyMix(message.mix);
      break;
    case 'eng:playOneShot':
      void handlePlayOneShot(message.preset);
      break;
    case 'eng:stop':
      void handleStop();
      break;
    default:
      break;
  }
});

void ensureAudioContext().then(() => post({ type: 'eng:ready' }));
