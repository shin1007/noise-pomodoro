import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'Concentración', description: 'Ruido marrón combinado con un latido en banda beta, para el trabajo concentrado.' },
    creative: { name: 'Creatividad', description: 'Ruido rosa combinado con un latido en banda alfa, para un pensamiento creativo y relajado.' },
    study: { name: 'Estudio', description: 'Ruido blanco combinado con un latido en banda gamma, para estudiar y leer.' },
    meditation: { name: 'Meditación', description: 'Sin sonido de fondo, solo un latido en banda theta, para meditar.' },
    sleep: { name: 'Sueño', description: 'Ruido marrón combinado con un latido en banda delta, para un descanso profundo.' },
    file1: { name: 'Archivo de audio personalizado', description: 'Reproduce cualquier archivo de audio como sonido de fondo. El latido se puede activar por separado.' },
    custom1: { name: 'Código personalizado', description: 'Reproduce su propio código de forma de onda como sonido de fondo. El latido se puede activar por separado.' },
  },
  chimes: {
    bell: 'Campana',
    beep: 'Pitido',
    marimba: 'Marimba',
  },
  phaseEnd: {
    focusToastMessage: '¡Tiempo de concentración terminado! Tomemos un descanso.',
    breakToastMessage: '¡Descanso terminado! Volvamos a concentrarnos.',
  },
};

export default strings;
