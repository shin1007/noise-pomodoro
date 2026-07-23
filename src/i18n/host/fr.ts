import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'fr',
    panelTitle: 'Noise Pomodoro',
    loading: 'Chargement…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Cliquez pour jouer le dernier son utilisé',
    idleTooltipOpenPanel: (panelTitle) => `Cliquez pour ouvrir le panneau ${panelTitle}`,
    presetPlayingTooltip: (name) => `Lecture : ${name} — cliquez pour arrêter`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Lecture : ${name} (arrêt dans ${mmss}) — cliquez pour arrêter`,
    pomodoroTooltip: (phaseLabel) => `Pomodoro ${phaseLabel} — cliquez pour ouvrir le panneau`,
    phaseLabel: {
      focus: 'concentration',
      break: 'pause',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'Lecture arrêtée car le panneau a été fermé.',
    cannotPlay: (message) => `Lecture impossible : ${message}`,
    unknownPreset: (presetId) => `Préréglage inconnu : ${presetId}`,
    binauralLabel: 'Binaural',
    isochronicLabel: 'Isochrone',
    focusPhaseEndDefault: 'Temps de concentration terminé !',
    breakPhaseEndDefault: 'Pause terminée !',
  },
  fileDialog: {
    selectFileLabel: 'Sélectionner un fichier audio',
    audioFilesFilterLabel: 'Fichiers audio',
    fileTooLarge: (mb, maxMb) => `Le fichier audio est trop volumineux (${mb} Mo). La limite est de ${maxMb} Mo.`,
    fileLargeWarning: (fsPath) => `« ${fsPath} » dépasse 50 Mo. Les fichiers de boucle ambiante sont généralement bien plus courts.`,
  },
  scriptRunner: {
    workspaceNotTrusted:
      'Les scripts de fin de phase ne s’exécutent que dans les espaces de travail approuvés. Ignoré car l’espace de travail actuel n’est pas approuvé.',
    featureDisabled: 'Un script de fin de phase est configuré mais désactivé. Activez "noisePomodoro.enablePhaseEndScripts" dans les paramètres pour l’exécuter.',
    scriptError: (message) => `Erreur du script de fin de phase : ${message}`,
  },
  backgroundLabel: {
    file: 'Fichier',
    custom: 'Personnalisé',
  },
};

export default strings;
