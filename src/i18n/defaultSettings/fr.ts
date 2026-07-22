import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'Concentration', description: 'Bruit brun combiné à un battement dans la bande bêta, pour le travail concentré.' },
    creative: { name: 'Créativité', description: 'Bruit rose combiné à un battement dans la bande alpha, pour une réflexion créative et détendue.' },
    study: { name: 'Étude', description: 'Bruit blanc combiné à un battement dans la bande gamma, pour étudier et lire.' },
    meditation: { name: 'Méditation', description: 'Aucun son de fond, seulement un battement dans la bande thêta, pour la méditation.' },
    sleep: { name: 'Sommeil', description: 'Bruit brun combiné à un battement dans la bande delta, pour un repos profond.' },
    file1: { name: 'Fichier audio personnalisé', description: 'Lit un fichier audio de votre choix comme son de fond. Le battement peut être activé séparément.' },
    custom1: { name: 'Code personnalisé', description: 'Lit votre propre code de forme d’onde comme son de fond. Le battement peut être activé séparément.' },
  },
  chimes: {
    bell: 'Cloche',
    beep: 'Bip',
    marimba: 'Marimba',
  },
  phaseEnd: {
    focusToastMessage: 'Temps de concentration terminé ! Faites une pause.',
    breakToastMessage: 'Pause terminée ! Reprenons la concentration.',
  },
};

export default strings;
