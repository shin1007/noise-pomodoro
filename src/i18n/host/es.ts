import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'es',
    panelTitle: 'White Noise & Pomodoro',
    loading: 'Cargando…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Haga clic para reproducir el último sonido usado',
    idleTooltipOpenPanel: (panelTitle) => `Haga clic para abrir el panel ${panelTitle}`,
    presetPlayingTooltip: (name) => `Reproduciendo: ${name} — clic para detener`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Reproduciendo: ${name} (se detiene en ${mmss}) — clic para detener`,
    pomodoroTooltip: (phaseLabel) => `Pomodoro ${phaseLabel} — clic para abrir el panel`,
    phaseLabel: {
      focus: 'concentración',
      break: 'descanso',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'Reproducción detenida porque se cerró el panel.',
    cannotPlay: (message) => `No se puede reproducir: ${message}`,
    unknownPreset: (presetId) => `Preajuste desconocido: ${presetId}`,
    binauralLabel: 'Binaural',
    isochronicLabel: 'Isocrónico',
    focusPhaseEndDefault: '¡Tiempo de concentración terminado!',
    breakPhaseEndDefault: '¡Descanso terminado!',
  },
  fileDialog: {
    selectFileLabel: 'Seleccionar archivo de audio',
    audioFilesFilterLabel: 'Archivos de audio',
    fileTooLarge: (mb, maxMb) => `El archivo de audio es demasiado grande (${mb}MB). El límite es ${maxMb}MB.`,
    fileLargeWarning: (fsPath) => `"${fsPath}" supera los 50MB. Los archivos de bucle ambiental suelen ser mucho más cortos.`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'Los scripts de fin de fase solo se ejecutan en espacios de trabajo de confianza. Omitido porque el espacio de trabajo actual no es de confianza.',
    featureDisabled: 'Hay un script de fin de fase configurado pero deshabilitado. Habilite "whiteNoise.enablePhaseEndScripts" en la configuración para ejecutarlo.',
    scriptError: (message) => `Error en el script de fin de fase: ${message}`,
  },
  backgroundLabel: {
    file: 'Archivo',
    custom: 'Personalizado',
  },
};

export default strings;
