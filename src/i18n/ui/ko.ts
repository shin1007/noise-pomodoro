import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: '불러오는 중…',
  common: {
    off: '꺼짐',
  },
  brainwaveBands: {
    delta: '델타',
    theta: '세타',
    alpha: '알파',
    beta: '베타',
    gamma: '감마',
  },
  noiseTypes: {
    white: '화이트',
    pink: '핑크',
    brown: '브라운',
    blue: '블루',
    violet: '바이올렛',
  },
  background: {
    heading: '배경음',
    fileMode: '📁 오디오 파일',
    customMode: '🧪 커스텀 코드',
    fileLabel: (fileName) => `파일: ${fileName}`,
    noFileSelected: '선택된 파일 없음',
    changeFile: '파일 변경',
    selectFile: '파일 선택',
    customCodeHint: 't: 경과 시간(초), params: 사용자 정의 매개변수. -1~1 사이의 값을 반환하세요.',
    apply: '적용',
  },
  beat: {
    heading: '비트',
    baseFrequencyLabel: '기본 주파수',
    binauralMode: '이어폰(바이노럴)',
    isochronicMode: '스피커(아이소크로닉)',
  },
  controls: {
    volumeLabel: '음량',
    outputLimiterLabel: '출력 음량 제한',
  },
  header: {
    noNoise: '노이즈 없음',
    fileBackgroundLabel: '파일',
    customBackgroundLabel: '커스텀',
    iconPlaceholder: '아이콘',
    namePlaceholder: '이름',
    descriptionPlaceholder: '설명',
    resetPresetsButton: '프리셋을 기본값으로 재설정',
    applyToPresetButton: '현재 설정을 프리셋에 적용',
  },
  pomodoroSettings: {
    modalTitle: '뽀모도로 설정',
    focusDuration: '집중 시간',
    breakDuration: '휴식 시간',
    timeMinutesLabel: '시간(분): ',
    noneOption: '(없음)',
    soundLabel: ' 소리: ',
    autoAdvanceLabel: ' 다음 단계로 자동 진행',
    toastOnEndLabel: ' 종료 시 알림 표시',
    playEndSoundLabel: ' 종료 시 소리 재생: ',
  },
  timer: {
    heading: '타이머',
    none: '없음',
    minutesUnit: (n) => `${n}분`,
    start: '시작',
    resume: '재개',
    pause: '일시정지',
    reset: '재설정',
    skipPhase: '다음 단계로 건너뛰기',
    pomodoroToggle: (on) => `뽀모도로 ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
