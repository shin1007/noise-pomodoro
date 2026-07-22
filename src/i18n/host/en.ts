import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'en',
    panelTitle: 'White Noise & Pomodoro',
    loading: 'Loading…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Click to play the last used sound',
    idleTooltipOpenPanel: (panelTitle) => `Click to open the ${panelTitle} panel`,
    presetPlayingTooltip: (name) => `Playing: ${name} — click to stop`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Playing: ${name} (stops in ${mmss}) — click to stop`,
    pomodoroTooltip: (phaseLabel) => `Pomodoro ${phaseLabel} — click to open panel`,
    phaseLabel: {
      focus: 'focus',
      break: 'break',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'Stopped playback because the panel was closed.',
    cannotPlay: (message) => `Cannot play: ${message}`,
    unknownPreset: (presetId) => `Unknown preset: ${presetId}`,
    binauralLabel: 'Binaural',
    isochronicLabel: 'Isochronic',
    focusPhaseEndDefault: 'Focus time is over!',
    breakPhaseEndDefault: 'Break is over!',
  },
  fileDialog: {
    selectFileLabel: 'Select audio file',
    audioFilesFilterLabel: 'Audio files',
    fileTooLarge: (mb, maxMb) => `Audio file is too large (${mb}MB). The limit is ${maxMb}MB.`,
    fileLargeWarning: (fsPath) => `"${fsPath}" exceeds 50MB. Ambient loop files are usually much shorter than this.`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'Phase-end scripts only run in trusted workspaces. Skipped because the current workspace is not trusted.',
    featureDisabled: 'A phase-end script is configured but disabled. Enable "whiteNoise.enablePhaseEndScripts" in settings to run it.',
    scriptError: (message) => `Phase-end script error: ${message}`,
  },
  backgroundLabel: {
    file: 'File',
    custom: 'Custom',
  },
};

export default strings;
