import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: 'फ़ोकस', description: 'ब्राउन नॉइज़ के साथ बीटा-बैंड बीट, केंद्रित काम के लिए उपयुक्त संयोजन।' },
    creative: { name: 'सोच', description: 'पिंक नॉइज़ के साथ अल्फ़ा-बैंड बीट, आरामदायक और रचनात्मक सोच के लिए संयोजन।' },
    study: { name: 'अध्ययन', description: 'व्हाइट नॉइज़ के साथ गामा-बैंड बीट, अध्ययन और पढ़ाई के लिए संयोजन।' },
    meditation: { name: 'ध्यान', description: 'कोई पृष्ठभूमि ध्वनि नहीं, केवल थीटा-बैंड बीट, ध्यान के लिए।' },
    sleep: { name: 'नींद', description: 'ब्राउन नॉइज़ के साथ डेल्टा-बैंड बीट, गहरे आराम के लिए संयोजन।' },
    file1: { name: 'कस्टम ऑडियो फ़ाइल', description: 'किसी भी ऑडियो फ़ाइल को पृष्ठभूमि ध्वनि के रूप में चलाता है। बीट को अलग से चालू किया जा सकता है।' },
    custom1: { name: 'कस्टम कोड', description: 'आपके अपने वेवफ़ॉर्म कोड को पृष्ठभूमि ध्वनि के रूप में चलाता है। बीट को अलग से चालू किया जा सकता है।' },
  },
  chimes: {
    bell: 'घंटी',
    beep: 'बीप',
    marimba: 'मारिम्बा',
  },
  phaseEnd: {
    focusToastMessage: 'फ़ोकस समय समाप्त हो गया! ब्रेक लेने का समय है।',
    breakToastMessage: 'ब्रेक समाप्त हो गया! फिर से फ़ोकस करते हैं।',
  },
};

export default strings;
