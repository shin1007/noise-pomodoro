import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'Fokus', description: 'Braunes Rauschen kombiniert mit einem Beat im Beta-Band, abgestimmt auf konzentriertes Arbeiten.' },
    creative: { name: 'Kreativ', description: 'Rosa Rauschen kombiniert mit einem Beat im Alpha-Band, für entspanntes, kreatives Denken.' },
    study: { name: 'Lernen', description: 'Weißes Rauschen kombiniert mit einem Beat im Gamma-Band, zum Lernen und Lesen.' },
    meditation: { name: 'Meditation', description: 'Kein Hintergrundklang, nur ein Beat im Theta-Band, für die Meditation.' },
    sleep: { name: 'Schlaf', description: 'Braunes Rauschen kombiniert mit einem Beat im Delta-Band, für tiefe Erholung.' },
    file1: { name: 'Eigene Audiodatei', description: 'Spielt eine beliebige Audiodatei als Hintergrundklang ab. Der Beat kann separat aktiviert werden.' },
    custom1: { name: 'Eigener Code', description: 'Spielt Ihren eigenen Wellenform-Code als Hintergrundklang ab. Der Beat kann separat aktiviert werden.' },
  },
  chimes: {
    bell: 'Glocke',
    beep: 'Piepton',
    marimba: 'Marimba',
  },
  phaseEnd: {
    focusToastMessage: 'Fokuszeit ist vorbei! Zeit für eine Pause.',
    breakToastMessage: 'Pause ist vorbei! Zurück zum Fokus.',
  },
};

export default strings;
