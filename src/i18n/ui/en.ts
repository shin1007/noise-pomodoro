import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Loading…',
  common: {
    off: 'Off',
  },
  brainwaveBands: {
    delta: 'Delta',
    theta: 'Theta',
    alpha: 'Alpha',
    beta: 'Beta',
    gamma: 'Gamma',
  },
  noiseTypes: {
    white: 'White',
    pink: 'Pink',
    brown: 'Brown',
    blue: 'Blue',
    violet: 'Violet',
  },
  background: {
    heading: 'Background sound',
    fileMode: '📁 Audio file',
    customMode: '🧪 Custom code',
    fileLabel: (fileName) => `File: ${fileName}`,
    noFileSelected: 'No file selected',
    changeFile: 'Change file',
    selectFile: 'Select file',
    customCodeHint: 't: elapsed seconds, params: custom parameters. Return a value between -1 and 1.',
    apply: 'Apply',
  },
  beat: {
    heading: 'Beat',
    baseFrequencyLabel: 'Base frequency',
    binauralMode: 'Earphones (Binaural)',
    isochronicMode: 'Speaker (Isochronic)',
  },
  controls: {
    volumeLabel: 'Volume',
    outputLimiterLabel: 'Output limiter',
  },
  header: {
    noNoise: 'No noise',
    fileBackgroundLabel: 'File',
    customBackgroundLabel: 'Custom',
    iconPlaceholder: 'Icon',
    namePlaceholder: 'Name',
    descriptionPlaceholder: 'Description',
    resetPresetsButton: 'Reset presets to default',
    applyToPresetButton: 'Apply current settings to preset',
  },
  pomodoroSettings: {
    modalTitle: 'Pomodoro settings',
    focusDuration: 'Focus duration',
    breakDuration: 'Break duration',
    timeMinutesLabel: 'Time (min): ',
    noneOption: '(None)',
    soundLabel: ' Sound: ',
    autoAdvanceLabel: ' Automatically advance to next phase',
    toastOnEndLabel: ' Show toast notification on end',
    playEndSoundLabel: ' Play end sound: ',
  },
  timer: {
    heading: 'Timer',
    none: 'None',
    minutesUnit: (n) => `${n} min`,
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    reset: 'Reset',
    skipPhase: 'Skip to next phase',
    pomodoroToggle: (on) => `Pomodoro ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
