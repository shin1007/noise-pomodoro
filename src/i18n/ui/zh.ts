import type { UiStrings } from './index';

// 简体中文。
const strings: UiStrings = {
  loading: '加载中…',
  common: {
    off: '关闭',
  },
  brainwaveBands: {
    delta: 'Delta（δ）',
    theta: 'Theta（θ）',
    alpha: 'Alpha（α）',
    beta: 'Beta（β）',
    gamma: 'Gamma（γ）',
  },
  noiseTypes: {
    white: '白噪音',
    pink: '粉红噪音',
    brown: '布朗噪音',
    blue: '蓝噪音',
    violet: '紫噪音',
  },
  background: {
    heading: '背景音',
    fileMode: '📁 音频文件',
    customMode: '🧪 自定义代码',
    fileLabel: (fileName) => `文件：${fileName}`,
    noFileSelected: '未选择文件',
    changeFile: '更改文件',
    selectFile: '选择文件',
    customCodeHint: 't：经过的秒数，params：自定义参数。请返回 -1 到 1 之间的值。',
    apply: '应用',
  },
  beat: {
    heading: '节拍',
    baseFrequencyLabel: '基础频率',
    binauralMode: '耳机（双耳节拍）',
    isochronicMode: '扬声器（等时音）',
  },
  controls: {
    volumeLabel: '音量',
  },
  header: {
    noNoise: '无噪音',
    fileBackgroundLabel: '文件',
    customBackgroundLabel: '自定义',
    iconPlaceholder: '图标',
    namePlaceholder: '名称',
    descriptionPlaceholder: '描述',
    resetPresetsButton: '恢复默认预设',
    applyToPresetButton: '将当前设置应用到预设',
  },
  pomodoroSettings: {
    modalTitle: '番茄钟设置',
    focusDuration: '专注时长',
    breakDuration: '休息时长',
    timeMinutesLabel: '时长（分钟）：',
    noneOption: '（无）',
    soundLabel: ' 提示音：',
    autoAdvanceLabel: ' 自动进入下一阶段',
    toastOnEndLabel: ' 结束时显示通知',
    playEndSoundLabel: ' 结束时播放提示音：',
  },
  timer: {
    heading: '计时器',
    none: '无',
    minutesUnit: (n) => `${n} 分钟`,
    sleepGuardNote: '番茄钟运行时无法使用。重置后即可使用。',
    start: '开始',
    resume: '继续',
    pause: '暂停',
    reset: '重置',
    skipPhase: '跳到下一阶段',
    pomodoroToggle: (on) => `番茄钟 ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
