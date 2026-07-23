import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Wird geladen…',
  common: {
    off: 'Aus',
  },
  brainwaveBands: {
    delta: 'Delta',
    theta: 'Theta',
    alpha: 'Alpha',
    beta: 'Beta',
    gamma: 'Gamma',
  },
  noiseTypes: {
    white: 'Weiß',
    pink: 'Rosa',
    brown: 'Braun',
    blue: 'Blau',
    violet: 'Violett',
  },
  background: {
    heading: 'Hintergrundklang',
    fileMode: '📁 Audiodatei',
    customMode: '🧪 Eigener Code',
    fileLabel: (fileName) => `Datei: ${fileName}`,
    noFileSelected: 'Keine Datei ausgewählt',
    changeFile: 'Datei ändern',
    selectFile: 'Datei auswählen',
    customCodeHint: 't: verstrichene Sekunden, params: benutzerdefinierte Parameter. Geben Sie einen Wert zwischen -1 und 1 zurück.',
    apply: 'Übernehmen',
  },
  beat: {
    heading: 'Beat',
    baseFrequencyLabel: 'Basisfrequenz',
    binauralMode: 'Kopfhörer (binaural)',
    isochronicMode: 'Lautsprecher (isochron)',
  },
  controls: {
    volumeLabel: 'Lautstärke',
    outputLimiterLabel: 'Ausgangsbegrenzer',
  },
  header: {
    noNoise: 'Kein Rauschen',
    fileBackgroundLabel: 'Datei',
    customBackgroundLabel: 'Eigener',
    iconPlaceholder: 'Symbol',
    namePlaceholder: 'Name',
    descriptionPlaceholder: 'Beschreibung',
    resetPresetsButton: 'Voreinstellungen zurücksetzen',
    applyToPresetButton: 'Aktuelle Einstellungen auf Voreinstellung anwenden',
  },
  pomodoroSettings: {
    modalTitle: 'Pomodoro-Einstellungen',
    focusDuration: 'Fokuszeit',
    breakDuration: 'Pausenzeit',
    timeMinutesLabel: 'Dauer (Min.): ',
    noneOption: '(Keine)',
    soundLabel: ' Klang: ',
    autoAdvanceLabel: ' Automatisch zur nächsten Phase wechseln',
    toastOnEndLabel: ' Benachrichtigung am Ende anzeigen',
    playEndSoundLabel: ' Endklang abspielen: ',
  },
  timer: {
    heading: 'Timer',
    none: 'Keine',
    minutesUnit: (n) => `${n} Min.`,
    start: 'Start',
    resume: 'Fortsetzen',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    skipPhase: 'Zur nächsten Phase springen',
    pomodoroToggle: (on) => `Pomodoro ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
