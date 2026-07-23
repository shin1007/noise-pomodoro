import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Carregando…',
  common: {
    off: 'Desativado',
  },
  brainwaveBands: {
    delta: 'Delta',
    theta: 'Teta',
    alpha: 'Alfa',
    beta: 'Beta',
    gamma: 'Gama',
  },
  noiseTypes: {
    white: 'Branco',
    pink: 'Rosa',
    brown: 'Marrom',
    blue: 'Azul',
    violet: 'Violeta',
  },
  background: {
    heading: 'Som de fundo',
    fileMode: '📁 Arquivo de áudio',
    customMode: '🧪 Código personalizado',
    fileLabel: (fileName) => `Arquivo: ${fileName}`,
    noFileSelected: 'Nenhum arquivo selecionado',
    changeFile: 'Alterar arquivo',
    selectFile: 'Selecionar arquivo',
    customCodeHint: 't: segundos decorridos, params: parâmetros personalizados. Retorne um valor entre -1 e 1.',
    apply: 'Aplicar',
  },
  beat: {
    heading: 'Batida',
    baseFrequencyLabel: 'Frequência base',
    binauralMode: 'Fones de ouvido (binaural)',
    isochronicMode: 'Alto-falante (isocrônico)',
  },
  controls: {
    volumeLabel: 'Volume',
    outputLimiterLabel: 'Limitador de saída',
  },
  header: {
    noNoise: 'Sem ruído',
    fileBackgroundLabel: 'Arquivo',
    customBackgroundLabel: 'Personalizado',
    iconPlaceholder: 'Ícone',
    namePlaceholder: 'Nome',
    descriptionPlaceholder: 'Descrição',
    resetPresetsButton: 'Redefinir predefinições',
    applyToPresetButton: 'Aplicar configurações atuais à predefinição',
  },
  pomodoroSettings: {
    modalTitle: 'Configurações do Pomodoro',
    focusDuration: 'Duração do foco',
    breakDuration: 'Duração da pausa',
    timeMinutesLabel: 'Duração (min): ',
    noneOption: '(Nenhum)',
    soundLabel: ' Som: ',
    autoAdvanceLabel: ' Avançar automaticamente para a próxima fase',
    toastOnEndLabel: ' Mostrar notificação ao final',
    playEndSoundLabel: ' Reproduzir som ao final: ',
  },
  timer: {
    heading: 'Temporizador',
    none: 'Nenhum',
    minutesUnit: (n) => `${n} min`,
    start: 'Iniciar',
    resume: 'Retomar',
    pause: 'Pausar',
    reset: 'Redefinir',
    skipPhase: 'Pular para a próxima fase',
    pomodoroToggle: (on) => `Pomodoro ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
