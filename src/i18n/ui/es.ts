import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'Cargando…',
  common: {
    off: 'Desactivado',
  },
  brainwaveBands: {
    delta: 'Delta',
    theta: 'Theta',
    alpha: 'Alfa',
    beta: 'Beta',
    gamma: 'Gamma',
  },
  noiseTypes: {
    white: 'Blanco',
    pink: 'Rosa',
    brown: 'Marrón',
    blue: 'Azul',
    violet: 'Violeta',
  },
  background: {
    heading: 'Sonido de fondo',
    fileMode: '📁 Archivo de audio',
    customMode: '🧪 Código personalizado',
    fileLabel: (fileName) => `Archivo: ${fileName}`,
    noFileSelected: 'Ningún archivo seleccionado',
    changeFile: 'Cambiar archivo',
    selectFile: 'Seleccionar archivo',
    customCodeHint: 't: segundos transcurridos, params: parámetros personalizados. Debe devolver un valor entre -1 y 1.',
    apply: 'Aplicar',
  },
  beat: {
    heading: 'Latido',
    baseFrequencyLabel: 'Frecuencia base',
    binauralMode: 'Auriculares (binaural)',
    isochronicMode: 'Altavoz (isocrónico)',
  },
  controls: {
    volumeLabel: 'Volumen',
  },
  header: {
    noNoise: 'Sin ruido',
    fileBackgroundLabel: 'Archivo',
    customBackgroundLabel: 'Personalizado',
    iconPlaceholder: 'Icono',
    namePlaceholder: 'Nombre',
    descriptionPlaceholder: 'Descripción',
    resetPresetsButton: 'Restablecer preajustes',
    applyToPresetButton: 'Aplicar los ajustes actuales al preajuste',
  },
  pomodoroSettings: {
    modalTitle: 'Ajustes de Pomodoro',
    focusDuration: 'Duración de concentración',
    breakDuration: 'Duración del descanso',
    timeMinutesLabel: 'Duración (min): ',
    noneOption: '(Ninguno)',
    soundLabel: ' Sonido: ',
    autoAdvanceLabel: ' Avanzar automáticamente a la siguiente fase',
    toastOnEndLabel: ' Mostrar notificación al finalizar',
    playEndSoundLabel: ' Reproducir sonido al finalizar: ',
  },
  timer: {
    heading: 'Temporizador',
    none: 'Ninguno',
    minutesUnit: (n) => `${n} min`,
    start: 'Iniciar',
    resume: 'Reanudar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    skipPhase: 'Saltar a la siguiente fase',
    pomodoroToggle: (on) => `Pomodoro ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
