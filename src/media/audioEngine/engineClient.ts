import type { EngineToExtMessage, ExtToEngineMessage } from '../../protocol';
import type { NoiseType, ToneType, WorkletInMessage, WorkletOutMessage } from '../../audioEngine/worklets/messages';

declare function acquireVsCodeApi(): {
  postMessage(message: EngineToExtMessage): void;
};

declare global {
  interface Window {
    __WORKLET_URI__: string;
  }
}

const NOISE_TYPES: readonly string[] = ['white', 'pink', 'brown'];
const TONE_TYPES: readonly string[] = ['isochronic', 'binaural', 'solfeggio'];

const vscode = acquireVsCodeApi();

function post(message: EngineToExtMessage): void {
  vscode.postMessage(message);
}

let audioContext: AudioContext | undefined;
let masterGain: GainNode | undefined;

// worklet ベースの再生（ノイズ / トーン / カスタムコードのプリセット）
let activeNode: AudioWorkletNode | undefined;
let activeNodeKind: 'noise' | 'tone' | 'custom' | undefined;

// ファイル再生（AudioBufferSourceNode を使用し、worklet は使わない）
let fileSource: AudioBufferSourceNode | undefined;
let fileGain: GainNode | undefined;

let currentPresetId: string | null = null;

async function ensureAudioContext(): Promise<AudioContext> {
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
  }
  audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule(window.__WORKLET_URI__);
  masterGain = audioContext.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioContext.destination);
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
}

function postToWorklet(message: WorkletInMessage): void {
  activeNode?.port.postMessage(message);
}

function stopActive(): void {
  if (activeNode) {
    activeNode.port.onmessage = null;
    activeNode.disconnect();
  }
  activeNode = undefined;
  activeNodeKind = undefined;

  if (fileSource) {
    fileSource.onended = null;
    try {
      fileSource.stop();
    } catch {
      // すでに停止済み / 終了済みの場合は無視します。
    }
    fileSource.disconnect();
  }
  fileSource = undefined;
  fileGain?.disconnect();
  fileGain = undefined;
}

const PROCESSOR_NAME_BY_KIND: Record<'noise' | 'tone' | 'custom', string> = {
  noise: 'noise-processor',
  tone: 'tone-processor',
  custom: 'custom-code-processor',
};

async function ensureNodeForKind(kind: 'noise' | 'tone' | 'custom'): Promise<AudioWorkletNode> {
  const ctx = await ensureAudioContext();
  if (activeNode && activeNodeKind === kind) {
    return activeNode;
  }
  activeNode?.disconnect();
  activeNode = new AudioWorkletNode(ctx, PROCESSOR_NAME_BY_KIND[kind], { outputChannelCount: [2] });
  activeNode.connect(masterGain!);
  activeNode.port.onmessage = (event: MessageEvent<WorkletOutMessage>) => handleWorkletOutMessage(event.data);
  activeNodeKind = kind;
  return activeNode;
}

function handleWorkletOutMessage(message: WorkletOutMessage): void {
  if (message.type === 'customCodeError' && currentPresetId) {
    post({ type: 'eng:playbackError', presetId: currentPresetId, message: message.message });
  }
}

async function handleProceduralPlay(preset: Extract<ExtToEngineMessage, { type: 'eng:play' }>['preset']): Promise<void> {
  const { algorithm, params } = preset.procedural!;
  const kind = NOISE_TYPES.includes(algorithm) ? 'noise' : TONE_TYPES.includes(algorithm) ? 'tone' : undefined;
  if (!kind) {
    post({ type: 'eng:playbackError', presetId: preset.id, message: `Unknown algorithm "${algorithm}".` });
    return;
  }

  await ensureNodeForKind(kind);

  if (kind === 'noise') {
    postToWorklet({ type: 'setNoiseType', value: algorithm as NoiseType });
  } else {
    postToWorklet({ type: 'setToneType', value: algorithm as ToneType });
    for (const [key, value] of Object.entries(params ?? {})) {
      postToWorklet({ type: 'setParam', key, value });
    }
  }
  postToWorklet({ type: 'setVolume', value: preset.volume });

  currentPresetId = preset.id;
  post({ type: 'eng:playbackStarted', presetId: preset.id });
}

async function handleCustomPlay(preset: Extract<ExtToEngineMessage, { type: 'eng:play' }>['preset']): Promise<void> {
  if (!preset.custom) {
    post({ type: 'eng:playbackError', presetId: preset.id, message: 'No custom code provided.' });
    return;
  }
  await ensureNodeForKind('custom');
  postToWorklet({ type: 'setCustomCode', code: preset.custom.code, params: preset.custom.params });
  postToWorklet({ type: 'setVolume', value: preset.volume });

  currentPresetId = preset.id;
  post({ type: 'eng:playbackStarted', presetId: preset.id });
}

async function handleFilePlay(preset: Extract<ExtToEngineMessage, { type: 'eng:play' }>['preset']): Promise<void> {
  if (!preset.fileBytes) {
    post({ type: 'eng:playbackError', presetId: preset.id, message: 'No audio file data received.' });
    return;
  }
  const ctx = await ensureAudioContext();
  let audioBuffer: AudioBuffer;
  try {
    const bytes = preset.fileBytes;
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    audioBuffer = await ctx.decodeAudioData(arrayBuffer as ArrayBuffer);
  } catch (err) {
    post({ type: 'eng:playbackError', presetId: preset.id, message: `Failed to decode audio file: ${(err as Error).message}` });
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = preset.file?.loop ?? true;
  fileGain = ctx.createGain();
  fileGain.gain.value = preset.volume;
  source.connect(fileGain);
  fileGain.connect(masterGain!);
  source.onended = () => {
    if (fileSource === source) {
      fileSource = undefined;
      post({ type: 'eng:playbackEnded', presetId: preset.id });
    }
  };
  source.start(0);
  fileSource = source;

  currentPresetId = preset.id;
  post({ type: 'eng:playbackStarted', presetId: preset.id });
}

const ONE_SHOT_MAX_MS = 3000;

/**
 * フェーズ終了時の短い通知音を、背景再生とは別ノードで鳴らします。
 * activeNode / fileSource の再生を止めずに重ねられるようにしています。
 */
async function handlePlayOneShot(preset: Extract<ExtToEngineMessage, { type: 'eng:play' }>['preset']): Promise<void> {
  const ctx = await ensureAudioContext();

  if (preset.mode === 'file' && preset.fileBytes) {
    try {
      const bytes = preset.fileBytes;
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer as ArrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false;
      const gain = ctx.createGain();
      gain.gain.value = preset.volume;
      source.connect(gain);
      gain.connect(masterGain!);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      source.start(0);
    } catch (err) {
      post({ type: 'eng:playbackError', presetId: preset.id, message: `Failed to play end sound: ${(err as Error).message}` });
    }
    return;
  }

  if (preset.mode === 'custom' && preset.custom) {
    const node = new AudioWorkletNode(ctx, 'custom-code-processor', { outputChannelCount: [2] });
    node.connect(masterGain!);
    node.port.postMessage({ type: 'setCustomCode', code: preset.custom.code, params: preset.custom.params } satisfies WorkletInMessage);
    node.port.postMessage({ type: 'setVolume', value: preset.volume } satisfies WorkletInMessage);
    setTimeout(() => node.disconnect(), ONE_SHOT_MAX_MS);
    return;
  }

  if (preset.mode === 'procedural' && preset.procedural) {
    const { algorithm, params } = preset.procedural;
    const processorName = NOISE_TYPES.includes(algorithm) ? 'noise-processor' : 'tone-processor';
    const node = new AudioWorkletNode(ctx, processorName, { outputChannelCount: [2] });
    node.connect(masterGain!);
    if (processorName === 'noise-processor') {
      node.port.postMessage({ type: 'setNoiseType', value: algorithm as NoiseType } satisfies WorkletInMessage);
    } else {
      node.port.postMessage({ type: 'setToneType', value: algorithm as ToneType } satisfies WorkletInMessage);
      for (const [key, value] of Object.entries(params ?? {})) {
        node.port.postMessage({ type: 'setParam', key, value } satisfies WorkletInMessage);
      }
    }
    node.port.postMessage({ type: 'setVolume', value: preset.volume } satisfies WorkletInMessage);
    setTimeout(() => node.disconnect(), ONE_SHOT_MAX_MS);
  }
}

async function handlePlay(message: Extract<ExtToEngineMessage, { type: 'eng:play' }>): Promise<void> {
  const { preset } = message;
  stopActive();

  if (preset.mode === 'file') {
    await handleFilePlay(preset);
    return;
  }
  if (preset.mode === 'custom') {
    await handleCustomPlay(preset);
    return;
  }
  if (preset.mode === 'procedural' && preset.procedural) {
    await handleProceduralPlay(preset);
    return;
  }
  post({ type: 'eng:playbackError', presetId: preset.id, message: `Preset mode "${preset.mode}" is not supported yet.` });
}

function handleStop(): void {
  stopActive();
  currentPresetId = null;
}

function handlePause(): void {
  activeNode?.disconnect();
  fileGain?.disconnect();
}

function handleResume(): void {
  if (activeNode && masterGain) {
    activeNode.connect(masterGain);
  }
  if (fileGain && masterGain) {
    fileGain.connect(masterGain);
  }
}

function handleSetVolume(volume: number): void {
  if (masterGain) {
    masterGain.gain.value = volume;
  }
}

function handleSetCustomCode(presetId: string, code: string, params: Record<string, number>): void {
  if (presetId !== currentPresetId || activeNodeKind !== 'custom') {
    return;
  }
  postToWorklet({ type: 'setCustomCode', code, params });
}

function handleSetParam(presetId: string, paramKey: string, value: number): void {
  if (presetId !== currentPresetId) {
    return;
  }
  if (paramKey === 'volume') {
    if (fileGain) {
      fileGain.gain.value = value;
    } else {
      postToWorklet({ type: 'setVolume', value });
    }
  } else {
    postToWorklet({ type: 'setParam', key: paramKey, value });
  }
}

window.addEventListener('message', (event: MessageEvent<ExtToEngineMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'eng:play':
      void handlePlay(message);
      break;
    case 'eng:playOneShot':
      void handlePlayOneShot(message.preset);
      break;
    case 'eng:stop':
      handleStop();
      break;
    case 'eng:pause':
      handlePause();
      break;
    case 'eng:resume':
      handleResume();
      break;
    case 'eng:setVolume':
      handleSetVolume(message.volume);
      break;
    case 'eng:setParam':
      handleSetParam(message.presetId, message.paramKey, message.value);
      break;
    case 'eng:setCustomCode':
      handleSetCustomCode(message.presetId, message.code, message.params);
      break;
    default:
      break;
  }
});

void ensureAudioContext().then(() => post({ type: 'eng:ready' }));
