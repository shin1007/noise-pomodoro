import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: 'लोड हो रहा है…',
  common: {
    off: 'बंद',
  },
  brainwaveBands: {
    delta: 'डेल्टा',
    theta: 'थीटा',
    alpha: 'अल्फ़ा',
    beta: 'बीटा',
    gamma: 'गामा',
  },
  noiseTypes: {
    white: 'व्हाइट',
    pink: 'पिंक',
    brown: 'ब्राउन',
    blue: 'ब्लू',
    violet: 'वायलेट',
  },
  background: {
    heading: 'पृष्ठभूमि ध्वनि',
    fileMode: '📁 ऑडियो फ़ाइल',
    customMode: '🧪 कस्टम कोड',
    fileLabel: (fileName) => `फ़ाइल: ${fileName}`,
    noFileSelected: 'कोई फ़ाइल चयनित नहीं है',
    changeFile: 'फ़ाइल बदलें',
    selectFile: 'फ़ाइल चुनें',
    customCodeHint: 't: बीते हुए सेकंड, params: कस्टम पैरामीटर। -1 से 1 के बीच मान लौटाएँ।',
    apply: 'लागू करें',
  },
  beat: {
    heading: 'बीट',
    baseFrequencyLabel: 'आधार आवृत्ति',
    binauralMode: 'ईयरफ़ोन (बाइनॉरल)',
    isochronicMode: 'स्पीकर (आइसोक्रोनिक)',
  },
  controls: {
    volumeLabel: 'वॉल्यूम',
    outputLimiterLabel: 'आउटपुट सीमक',
  },
  header: {
    noNoise: 'कोई नॉइज़ नहीं',
    fileBackgroundLabel: 'फ़ाइल',
    customBackgroundLabel: 'कस्टम',
    iconPlaceholder: 'आइकन',
    namePlaceholder: 'नाम',
    descriptionPlaceholder: 'विवरण',
    resetPresetsButton: 'प्रीसेट डिफ़ॉल्ट पर रीसेट करें',
    applyToPresetButton: 'वर्तमान सेटिंग्स को प्रीसेट पर लागू करें',
  },
  pomodoroSettings: {
    modalTitle: 'पोमोडोरो सेटिंग्स',
    focusDuration: 'फ़ोकस अवधि',
    breakDuration: 'ब्रेक अवधि',
    timeMinutesLabel: 'समय (मिनट): ',
    noneOption: '(कोई नहीं)',
    soundLabel: ' ध्वनि: ',
    autoAdvanceLabel: ' अगले चरण में स्वतः आगे बढ़ें',
    toastOnEndLabel: ' समाप्ति पर सूचना दिखाएँ',
    playEndSoundLabel: ' समाप्ति पर ध्वनि चलाएँ: ',
  },
  timer: {
    heading: 'टाइमर',
    none: 'कोई नहीं',
    minutesUnit: (n) => `${n} मिनट`,
    start: 'शुरू करें',
    resume: 'फिर से शुरू करें',
    pause: 'रोकें',
    reset: 'रीसेट करें',
    skipPhase: 'अगले चरण पर जाएँ',
    pomodoroToggle: (on) => `पोमोडोरो ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
