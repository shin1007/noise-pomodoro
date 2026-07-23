import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'ko',
    panelTitle: 'Noise Pomodoro',
    loading: '불러오는 중…',
  },
  statusBar: {
    idleTooltipQuickPlay: '클릭하면 마지막으로 재생한 소리를 재생합니다',
    idleTooltipOpenPanel: (panelTitle) => `클릭하면 ${panelTitle} 패널을 엽니다`,
    presetPlayingTooltip: (name) => `재생 중: ${name} — 클릭하면 정지`,
    presetPlayingTooltipWithTimer: (name, mmss) => `재생 중: ${name} (${mmss} 후 정지) — 클릭하면 정지`,
    pomodoroTooltip: (phaseLabel) => `뽀모도로 ${phaseLabel} — 클릭하면 패널 열기`,
    phaseLabel: {
      focus: '집중',
      break: '휴식',
    },
  },
  toast: {
    panelClosedStoppedPlayback: '패널이 닫혀 재생이 중지되었습니다.',
    cannotPlay: (message) => `재생할 수 없습니다: ${message}`,
    unknownPreset: (presetId) => `알 수 없는 프리셋입니다: ${presetId}`,
    binauralLabel: '바이노럴',
    isochronicLabel: '아이소크로닉',
    focusPhaseEndDefault: '집중 시간이 끝났습니다!',
    breakPhaseEndDefault: '휴식이 끝났습니다!',
  },
  fileDialog: {
    selectFileLabel: '오디오 파일 선택',
    audioFilesFilterLabel: '오디오 파일',
    fileTooLarge: (mb, maxMb) => `오디오 파일이 너무 큽니다 (${mb}MB). 제한은 ${maxMb}MB입니다.`,
    fileLargeWarning: (fsPath) => `"${fsPath}"이(가) 50MB를 초과합니다. 환경음 루프 파일은 일반적으로 이보다 훨씬 짧습니다.`,
  },
  scriptRunner: {
    workspaceNotTrusted: '단계 종료 스크립트는 신뢰할 수 있는 작업 영역에서만 실행됩니다. 현재 작업 영역이 신뢰할 수 없어 건너뛰었습니다.',
    featureDisabled: '단계 종료 스크립트가 설정되어 있지만 비활성화되어 있습니다. 실행하려면 설정에서 "noisePomodoro.enablePhaseEndScripts"를 활성화하세요.',
    scriptError: (message) => `단계 종료 스크립트 오류: ${message}`,
  },
  backgroundLabel: {
    file: '파일',
    custom: '커스텀',
  },
};

export default strings;
