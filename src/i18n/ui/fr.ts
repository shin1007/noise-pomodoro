import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Chargement…',
  common: {
    off: 'Désactivé',
  },
  brainwaveBands: {
    delta: 'Delta',
    theta: 'Thêta',
    alpha: 'Alpha',
    beta: 'Bêta',
    gamma: 'Gamma',
  },
  noiseTypes: {
    white: 'Blanc',
    pink: 'Rose',
    brown: 'Brun',
    blue: 'Bleu',
    violet: 'Violet',
  },
  background: {
    heading: 'Son de fond',
    fileMode: '📁 Fichier audio',
    customMode: '🧪 Code personnalisé',
    fileLabel: (fileName) => `Fichier : ${fileName}`,
    noFileSelected: 'Aucun fichier sélectionné',
    changeFile: 'Changer de fichier',
    selectFile: 'Sélectionner un fichier',
    customCodeHint: 't : secondes écoulées, params : paramètres personnalisés. Retournez une valeur entre -1 et 1.',
    apply: 'Appliquer',
  },
  beat: {
    heading: 'Battement',
    baseFrequencyLabel: 'Fréquence de base',
    binauralMode: 'Écouteurs (binaural)',
    isochronicMode: 'Haut-parleur (isochrone)',
  },
  controls: {
    volumeLabel: 'Volume',
    outputLimiterLabel: 'Limiteur de sortie',
  },
  header: {
    noNoise: 'Aucun bruit',
    fileBackgroundLabel: 'Fichier',
    customBackgroundLabel: 'Personnalisé',
    iconPlaceholder: 'Icône',
    namePlaceholder: 'Nom',
    descriptionPlaceholder: 'Description',
    resetPresetsButton: 'Réinitialiser les préréglages',
    applyToPresetButton: 'Appliquer les réglages actuels au préréglage',
  },
  pomodoroSettings: {
    modalTitle: 'Réglages Pomodoro',
    focusDuration: 'Durée de concentration',
    breakDuration: 'Durée de pause',
    timeMinutesLabel: 'Durée (min) : ',
    noneOption: '(Aucun)',
    soundLabel: ' Son : ',
    autoAdvanceLabel: ' Passer automatiquement à la phase suivante',
    toastOnEndLabel: ' Afficher une notification à la fin',
    playEndSoundLabel: ' Jouer un son à la fin : ',
  },
  timer: {
    heading: 'Minuteur',
    none: 'Aucun',
    minutesUnit: (n) => `${n} min`,
    start: 'Démarrer',
    resume: 'Reprendre',
    pause: 'Pause',
    reset: 'Réinitialiser',
    skipPhase: 'Passer à la phase suivante',
    pomodoroToggle: (on) => `Pomodoro ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
