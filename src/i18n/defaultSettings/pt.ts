import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'Foco', description: 'Ruído marrom combinado com uma batida na banda beta, ajustado para o trabalho focado.' },
    creative: { name: 'Criatividade', description: 'Ruído rosa combinado com uma batida na banda alfa, para um pensamento criativo e relaxado.' },
    study: { name: 'Estudo', description: 'Ruído branco combinado com uma batida na banda gama, para estudar e ler.' },
    meditation: { name: 'Meditação', description: 'Sem som de fundo, apenas uma batida na banda teta, para meditação.' },
    sleep: { name: 'Sono', description: 'Ruído marrom combinado com uma batida na banda delta, para um descanso profundo.' },
    file1: { name: 'Arquivo de áudio personalizado', description: 'Reproduz qualquer arquivo de áudio como som de fundo. A batida pode ser ativada separadamente.' },
    custom1: { name: 'Código personalizado', description: 'Reproduz seu próprio código de forma de onda como som de fundo. A batida pode ser ativada separadamente.' },
  },
  chimes: {
    bell: 'Sino',
    beep: 'Bipe',
    marimba: 'Marimba',
  },
  phaseEnd: {
    focusToastMessage: 'O tempo de foco acabou! Hora de uma pausa.',
    breakToastMessage: 'A pausa acabou! Vamos voltar ao foco.',
  },
};

export default strings;
