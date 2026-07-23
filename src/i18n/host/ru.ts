import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'ru',
    panelTitle: 'Noise Pomodoro',
    loading: 'Загрузка…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Нажмите, чтобы воспроизвести последний использованный звук',
    idleTooltipOpenPanel: (panelTitle) => `Нажмите, чтобы открыть панель ${panelTitle}`,
    presetPlayingTooltip: (name) => `Воспроизводится: ${name} — нажмите, чтобы остановить`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Воспроизводится: ${name} (остановится через ${mmss}) — нажмите, чтобы остановить`,
    pomodoroTooltip: (phaseLabel) => `Помодоро ${phaseLabel} — нажмите, чтобы открыть панель`,
    phaseLabel: {
      focus: 'фокус',
      break: 'перерыв',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'Воспроизведение остановлено, так как панель была закрыта.',
    cannotPlay: (message) => `Невозможно воспроизвести: ${message}`,
    unknownPreset: (presetId) => `Неизвестный пресет: ${presetId}`,
    binauralLabel: 'Бинауральный',
    isochronicLabel: 'Изохронный',
    focusPhaseEndDefault: 'Время фокуса истекло!',
    breakPhaseEndDefault: 'Перерыв закончился!',
  },
  fileDialog: {
    selectFileLabel: 'Выбрать аудиофайл',
    audioFilesFilterLabel: 'Аудиофайлы',
    fileTooLarge: (mb, maxMb) => `Аудиофайл слишком большой (${mb}MB). Лимит составляет ${maxMb}MB.`,
    fileLargeWarning: (fsPath) => `«${fsPath}» превышает 50MB. Файлы для фоновых зацикленных звуков обычно значительно короче.`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'Скрипты завершения фазы выполняются только в доверенных рабочих областях. Пропущено, так как текущая рабочая область не является доверенной.',
    featureDisabled: 'Скрипт завершения фазы настроен, но отключён. Включите "noisePomodoro.enablePhaseEndScripts" в настройках, чтобы запустить его.',
    scriptError: (message) => `Ошибка скрипта завершения фазы: ${message}`,
  },
  backgroundLabel: {
    file: 'Файл',
    custom: 'Свой',
  },
};

export default strings;
