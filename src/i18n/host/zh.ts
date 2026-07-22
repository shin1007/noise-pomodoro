import type { HostStrings } from './index';

// 简体中文。
const strings: HostStrings = {
  chrome: {
    htmlLang: 'zh-CN',
    panelTitle: 'White Noise & Pomodoro',
    loading: '加载中…',
  },
  statusBar: {
    idleTooltipQuickPlay: '点击播放上次使用的声音',
    idleTooltipOpenPanel: (panelTitle) => `点击打开 ${panelTitle} 面板`,
    presetPlayingTooltip: (name) => `正在播放：${name} — 点击停止`,
    presetPlayingTooltipWithTimer: (name, mmss) => `正在播放：${name}（${mmss} 后停止） — 点击停止`,
    pomodoroTooltip: (phaseLabel) => `番茄钟 ${phaseLabel} — 点击打开面板`,
    phaseLabel: {
      focus: '专注',
      break: '休息',
    },
  },
  toast: {
    panelClosedStoppedPlayback: '面板已关闭，播放已停止。',
    cannotPlay: (message) => `无法播放：${message}`,
    unknownPreset: (presetId) => `未知预设：${presetId}`,
    binauralLabel: '双耳节拍',
    isochronicLabel: '等时音',
    focusPhaseEndDefault: '专注时间结束！',
    breakPhaseEndDefault: '休息结束！',
  },
  fileDialog: {
    selectFileLabel: '选择音频文件',
    audioFilesFilterLabel: '音频文件',
    fileTooLarge: (mb, maxMb) => `音频文件过大（${mb}MB）。上限为 ${maxMb}MB。`,
    fileLargeWarning: (fsPath) => `"${fsPath}" 超过了 50MB。环境音循环文件通常比这短得多。`,
  },
  scriptRunner: {
    workspaceNotTrusted: '阶段结束脚本仅在受信任的工作区中运行。由于当前工作区不受信任，已跳过执行。',
    featureDisabled: '已配置阶段结束脚本，但该功能已禁用。请在设置中启用 "whiteNoise.enablePhaseEndScripts" 以运行它。',
    scriptError: (message) => `阶段结束脚本出错：${message}`,
  },
  backgroundLabel: {
    file: '文件',
    custom: '自定义',
  },
};

export default strings;
