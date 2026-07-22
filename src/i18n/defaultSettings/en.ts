import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'Focus', description: 'Brown noise layered with a beta-band beat, tuned for focused work.' },
    creative: { name: 'Creative', description: 'Pink noise layered with an alpha-band beat, for relaxed, creative thinking.' },
    study: { name: 'Study', description: 'White noise layered with a gamma-band beat, for studying and reading.' },
    meditation: { name: 'Meditation', description: 'No background sound, just a theta-band beat, for meditation.' },
    sleep: { name: 'Sleep', description: 'Brown noise layered with a delta-band beat, for deep rest.' },
    file1: { name: 'Custom audio file', description: 'Plays any audio file as the background sound. The beat can be enabled separately.' },
    custom1: { name: 'Custom code', description: 'Plays your own waveform code as the background sound. The beat can be enabled separately.' },
  },
  chimes: {
    bell: 'Bell',
    beep: 'Beep',
    marimba: 'Marimba',
  },
  phaseEnd: {
    focusToastMessage: 'Focus time is over! Time for a break.',
    breakToastMessage: 'Break is over! Let’s get back to focusing.',
  },
};

export default strings;
