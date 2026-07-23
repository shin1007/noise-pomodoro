import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'de',
    panelTitle: 'Noise Pomodoro',
    loading: 'Wird geladen…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'Klicken, um den zuletzt verwendeten Klang abzuspielen',
    idleTooltipOpenPanel: (panelTitle) => `Klicken, um das Panel ${panelTitle} zu öffnen`,
    presetPlayingTooltip: (name) => `Wird abgespielt: ${name} — Klicken zum Stoppen`,
    presetPlayingTooltipWithTimer: (name, mmss) => `Wird abgespielt: ${name} (stoppt in ${mmss}) — Klicken zum Stoppen`,
    pomodoroTooltip: (phaseLabel) => `Pomodoro ${phaseLabel} — Klicken, um das Panel zu öffnen`,
    phaseLabel: {
      focus: 'Fokus',
      break: 'Pause',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'Wiedergabe gestoppt, da das Panel geschlossen wurde.',
    cannotPlay: (message) => `Wiedergabe nicht möglich: ${message}`,
    unknownPreset: (presetId) => `Unbekannte Voreinstellung: ${presetId}`,
    binauralLabel: 'Binaural',
    isochronicLabel: 'Isochron',
    focusPhaseEndDefault: 'Fokuszeit ist vorbei!',
    breakPhaseEndDefault: 'Pause ist vorbei!',
  },
  fileDialog: {
    selectFileLabel: 'Audiodatei auswählen',
    audioFilesFilterLabel: 'Audiodateien',
    fileTooLarge: (mb, maxMb) => `Die Audiodatei ist zu groß (${mb}MB). Das Limit beträgt ${maxMb}MB.`,
    fileLargeWarning: (fsPath) => `„${fsPath}" ist größer als 50MB. Ambient-Loop-Dateien sind normalerweise deutlich kürzer.`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'Phasenend-Skripte werden nur in vertrauenswürdigen Arbeitsbereichen ausgeführt. Übersprungen, da der aktuelle Arbeitsbereich nicht vertrauenswürdig ist.',
    featureDisabled: 'Ein Phasenend-Skript ist konfiguriert, aber deaktiviert. Aktivieren Sie "noisePomodoro.enablePhaseEndScripts" in den Einstellungen, um es auszuführen.',
    scriptError: (message) => `Fehler im Phasenend-Skript: ${message}`,
  },
  backgroundLabel: {
    file: 'Datei',
    custom: 'Eigener',
  },
};

export default strings;
