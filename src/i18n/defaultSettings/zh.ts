import type { DefaultSettingsStrings } from './index';

// 简体中文。
const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: '专注', description: '布朗噪音叠加 Beta 波段节拍，适合专注工作。' },
    creative: { name: '发想', description: '粉红噪音叠加 Alpha 波段节拍，适合放松的创意思考。' },
    study: { name: '学习', description: '白噪音叠加 Gamma 波段节拍，适合学习和阅读。' },
    meditation: { name: '冥想', description: '无背景音，仅播放 Theta 波段节拍，适合冥想。' },
    sleep: { name: '睡眠', description: '布朗噪音叠加 Delta 波段节拍，适合深度休息。' },
    file1: { name: '自定义音频文件', description: '播放任意音频文件作为背景音。节拍可另外单独开启。' },
    custom1: { name: '自定义代码', description: '播放您自己编写的波形代码作为背景音。节拍可另外单独开启。' },
  },
  chimes: {
    bell: '铃声',
    beep: '哔声',
    marimba: '马林巴',
  },
  phaseEnd: {
    focusToastMessage: '专注时间结束！休息一下吧。',
    breakToastMessage: '休息结束！重新开始专注吧。',
  },
};

export default strings;
