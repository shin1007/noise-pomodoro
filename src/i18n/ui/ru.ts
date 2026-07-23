import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Загрузка…',
  common: {
    off: 'Выкл',
  },
  brainwaveBands: {
    delta: 'Дельта',
    theta: 'Тета',
    alpha: 'Альфа',
    beta: 'Бета',
    gamma: 'Гамма',
  },
  noiseTypes: {
    white: 'Белый',
    pink: 'Розовый',
    brown: 'Коричневый',
    blue: 'Синий',
    violet: 'Фиолетовый',
  },
  background: {
    heading: 'Фоновый звук',
    fileMode: '📁 Аудиофайл',
    customMode: '🧪 Пользовательский код',
    fileLabel: (fileName) => `Файл: ${fileName}`,
    noFileSelected: 'Файл не выбран',
    changeFile: 'Изменить файл',
    selectFile: 'Выбрать файл',
    customCodeHint: 't: прошедшие секунды, params: пользовательские параметры. Верните значение от -1 до 1.',
    apply: 'Применить',
  },
  beat: {
    heading: 'Биения',
    baseFrequencyLabel: 'Базовая частота',
    binauralMode: 'Наушники (бинауральные)',
    isochronicMode: 'Динамик (изохронные)',
  },
  controls: {
    volumeLabel: 'Громкость',
    outputLimiterLabel: 'Ограничитель громкости',
  },
  header: {
    noNoise: 'Без шума',
    fileBackgroundLabel: 'Файл',
    customBackgroundLabel: 'Свой',
    iconPlaceholder: 'Значок',
    namePlaceholder: 'Название',
    descriptionPlaceholder: 'Описание',
    resetPresetsButton: 'Сбросить пресеты по умолчанию',
    applyToPresetButton: 'Применить текущие настройки к пресету',
  },
  pomodoroSettings: {
    modalTitle: 'Настройки Помодоро',
    focusDuration: 'Длительность фокуса',
    breakDuration: 'Длительность перерыва',
    timeMinutesLabel: 'Время (мин): ',
    noneOption: '(Нет)',
    soundLabel: ' Звук: ',
    autoAdvanceLabel: ' Автоматически переходить к следующей фазе',
    toastOnEndLabel: ' Показывать уведомление по окончании',
    playEndSoundLabel: ' Звук по окончании: ',
  },
  timer: {
    heading: 'Таймер',
    none: 'Нет',
    minutesUnit: (n) => `${n} мин`,
    start: 'Старт',
    resume: 'Продолжить',
    pause: 'Пауза',
    reset: 'Сбросить',
    skipPhase: 'Перейти к следующей фазе',
    pomodoroToggle: (on) => `Помодоро ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
