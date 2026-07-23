import type { HostStrings } from './index';

const strings: HostStrings = {
  chrome: {
    htmlLang: 'hi',
    panelTitle: 'Noise Pomodoro',
    loading: 'लोड हो रहा है…',
  },
  statusBar: {
    idleTooltipQuickPlay: 'पिछली बार इस्तेमाल की गई ध्वनि चलाने के लिए क्लिक करें',
    idleTooltipOpenPanel: (panelTitle) => `${panelTitle} पैनल खोलने के लिए क्लिक करें`,
    presetPlayingTooltip: (name) => `चल रहा है: ${name} — रोकने के लिए क्लिक करें`,
    presetPlayingTooltipWithTimer: (name, mmss) => `चल रहा है: ${name} (${mmss} में रुकेगा) — रोकने के लिए क्लिक करें`,
    pomodoroTooltip: (phaseLabel) => `पोमोडोरो ${phaseLabel} — पैनल खोलने के लिए क्लिक करें`,
    phaseLabel: {
      focus: 'फ़ोकस',
      break: 'ब्रेक',
    },
  },
  toast: {
    panelClosedStoppedPlayback: 'पैनल बंद होने के कारण प्लेबैक रोक दिया गया।',
    cannotPlay: (message) => `चलाया नहीं जा सकता: ${message}`,
    unknownPreset: (presetId) => `अज्ञात प्रीसेट: ${presetId}`,
    binauralLabel: 'बाइनॉरल',
    isochronicLabel: 'आइसोक्रोनिक',
    focusPhaseEndDefault: 'फ़ोकस समय समाप्त हो गया!',
    breakPhaseEndDefault: 'ब्रेक समाप्त हो गया!',
  },
  fileDialog: {
    selectFileLabel: 'ऑडियो फ़ाइल चुनें',
    audioFilesFilterLabel: 'ऑडियो फ़ाइलें',
    fileTooLarge: (mb, maxMb) => `ऑडियो फ़ाइल बहुत बड़ी है (${mb}MB). सीमा ${maxMb}MB है।`,
    fileLargeWarning: (fsPath) => `"${fsPath}" 50MB से अधिक है। एम्बिएंट लूप फ़ाइलें आमतौर पर इससे काफी छोटी होती हैं।`,
  },
  scriptRunner: {
    workspaceNotTrusted: 'चरण-समाप्ति स्क्रिप्ट केवल विश्वसनीय वर्कस्पेस में चलती हैं। वर्तमान वर्कस्पेस विश्वसनीय न होने के कारण छोड़ दिया गया।',
    featureDisabled: 'चरण-समाप्ति स्क्रिप्ट कॉन्फ़िगर की गई है लेकिन अक्षम है। इसे चलाने के लिए सेटिंग्स में "noisePomodoro.enablePhaseEndScripts" सक्षम करें।',
    scriptError: (message) => `चरण-समाप्ति स्क्रिप्ट त्रुटि: ${message}`,
  },
  backgroundLabel: {
    file: 'फ़ाइल',
    custom: 'कस्टम',
  },
};

export default strings;
