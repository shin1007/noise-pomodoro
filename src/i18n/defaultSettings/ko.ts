import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: '집중', description: '브라운 노이즈에 베타파 대역 비트를 더해 집중 작업에 맞춘 조합입니다.' },
    creative: { name: '발상', description: '핑크 노이즈에 알파파 대역 비트를 더해 편안한 발상에 맞춘 조합입니다.' },
    study: { name: '학습', description: '화이트 노이즈에 감마파 대역 비트를 더해 학습과 독서에 맞춘 조합입니다.' },
    meditation: { name: '명상', description: '배경음 없이 세타파 대역 비트만 재생하는 명상용 조합입니다.' },
    sleep: { name: '수면', description: '브라운 노이즈에 델타파 대역 비트를 더해 깊은 휴식에 맞춘 조합입니다.' },
    file1: { name: '커스텀 오디오 파일', description: '원하는 오디오 파일을 배경음으로 재생합니다. 비트는 별도로 켤 수 있습니다.' },
    custom1: { name: '커스텀 코드', description: '직접 작성한 파형 코드를 배경음으로 재생합니다. 비트는 별도로 켤 수 있습니다.' },
  },
  chimes: {
    bell: '벨',
    beep: '비프음',
    marimba: '마림바',
  },
  phaseEnd: {
    focusToastMessage: '집중 시간이 끝났습니다! 휴식을 취하세요.',
    breakToastMessage: '휴식이 끝났습니다! 다시 집중해 볼까요.',
  },
};

export default strings;
