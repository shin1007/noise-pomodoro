import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'ja',
    panelTitle: 'White Noise & Pomodoro',
    loading: '読み込み中…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'クリックすると直前に再生していた音を再生します',
    idleTooltipOpenPanel: (panelTitle) => `クリックすると ${panelTitle} パネルを開きます`,
    presetPlayingTooltip: (name) => `再生中: ${name} — クリックで停止`,
    presetPlayingTooltipWithTimer: (name, mmss) => `再生中: ${name}（あと ${mmss} で停止） — クリックで停止`,
    pomodoroTooltip: (phaseLabel) => `ポモドーロ ${phaseLabel} — クリックでパネルを開きます`,
    phaseLabel: {
      focus: '集中',
      break: '休憩',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'パネルを閉じたため、再生を停止しました。',
    cannotPlay: (message) => `再生できません: ${message}`,
    unknownPreset: (presetId) => `不明なプリセットです: ${presetId}`,
    binauralLabel: 'バイノーラル',
    isochronicLabel: 'アイソクロニック',
    focusPhaseEndDefault: '集中時間終了！',
    breakPhaseEndDefault: '休憩終了！',
  },
  fileDialog: {
    selectFileLabel: '音声ファイルを選択',
    audioFilesFilterLabel: '音声ファイル',
    fileTooLarge: (mb, maxMb) => `音声ファイルが大きすぎます（${mb}MB）。上限は ${maxMb}MB です。`,
    fileLargeWarning: (fsPath) => `"${fsPath}" は 50MB を超えています。環境音のループファイルは、通常これよりかなり短いです。`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'フェーズ終了スクリプトは、信頼済みのワークスペースでのみ実行されます。現在のワークスペースは信頼されていないためスキップしました。',
    featureDisabled: 'フェーズ終了スクリプトは設定されていますが無効です。実行するには設定で "whiteNoise.enablePhaseEndScripts" を有効にしてください。',
    scriptError: (message) => `フェーズ終了スクリプトのエラー: ${message}`,
  },
  backgroundLabel: {
    file: 'ファイル',
    custom: 'カスタム',
  },
};

export default strings;
