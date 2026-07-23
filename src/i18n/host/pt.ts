import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'pt',
    panelTitle: 'Noise Pomodoro',
    loading: 'Carregando…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Clique para reproduzir o último som usado',
    idleTooltipOpenPanel: (panelTitle) => `Clique para abrir o painel ${panelTitle}`,
    presetPlayingTooltip: (name) => `Reproduzindo: ${name} — clique para parar`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Reproduzindo: ${name} (para em ${mmss}) — clique para parar`,
    pomodoroTooltip: (phaseLabel) => `Pomodoro ${phaseLabel} — clique para abrir o painel`,
    phaseLabel: {
      focus: 'foco',
      break: 'pausa',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'A reprodução foi interrompida porque o painel foi fechado.',
    cannotPlay: (message) => `Não é possível reproduzir: ${message}`,
    unknownPreset: (presetId) => `Predefinição desconhecida: ${presetId}`,
    binauralLabel: 'Binaural',
    isochronicLabel: 'Isocrônico',
    focusPhaseEndDefault: 'O tempo de foco acabou!',
    breakPhaseEndDefault: 'A pausa acabou!',
  },
  fileDialog: {
    selectFileLabel: 'Selecionar arquivo de áudio',
    audioFilesFilterLabel: 'Arquivos de áudio',
    fileTooLarge: (mb, maxMb) => `O arquivo de áudio é muito grande (${mb}MB). O limite é ${maxMb}MB.`,
    fileLargeWarning: (fsPath) => `"${fsPath}" excede 50MB. Arquivos de loop ambiente costumam ser bem mais curtos.`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'Scripts de fim de fase só são executados em espaços de trabalho confiáveis. Ignorado porque o espaço de trabalho atual não é confiável.',
    featureDisabled: 'Um script de fim de fase está configurado, mas desativado. Ative "noisePomodoro.enablePhaseEndScripts" nas configurações para executá-lo.',
    scriptError: (message) => `Erro no script de fim de fase: ${message}`,
  },
  backgroundLabel: {
    file: 'Arquivo',
    custom: 'Personalizado',
  },
};

export default strings;
