import { API_BASE } from './api';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', bcp47: 'en-US' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', bcp47: 'mr-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'es', name: 'Spanish', native: 'Español', bcp47: 'es-ES' },
];

export const LANG_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

const LEVEL_NAMES = {
  hi: { clean: 'सुरक्षित', low: 'कम जोखिम', medium: 'मध्यम जोखिम', high: 'उच्च जोखिम', critical: 'अति गंभीर जोखिम' },
  kn: { clean: 'ಸುರಕ್ಷಿತ', low: 'ಕಡಿಮೆ ಅಪಾಯ', medium: 'ಮಧ್ಯಮ ಅಪಾಯ', high: 'ಹೆಚ್ಚಿನ ಅಪಾಯ', critical: 'ಅತ್ಯಂತ ಗಂಭೀರ ಅಪಾಯ' },
  mr: { clean: 'सुरक्षित', low: 'कमी धोका', medium: 'मध्यम धोका', high: 'जास्त धोका', critical: 'अतिशय गंभीर धोका' },
  te: { clean: 'సురక్షితం', low: 'తక్కువ ప్రమాదం', medium: 'మధ్యస్థ ప్రమాదం', high: 'అధిక ప్రమాదం', critical: 'అత్యంత తీవ్రమైన ప్రమాదం' },
  ta: { clean: 'பாதுகாப்பானது', low: 'குறைந்த ஆபத்து', medium: 'மிதமான ஆபத்து', high: 'அதிக ஆபத்து', critical: 'மிகத் தீவிர ஆபத்து' },
  bn: { clean: 'নিরাপদ', low: 'কম ঝুঁকি', medium: 'মাঝারি ঝুঁকি', high: 'উচ্চ ঝুঁকি', critical: 'অত্যন্ত গুরুতর ঝুঁকি' },
  es: { clean: 'Limpio', low: 'Riesgo bajo', medium: 'Riesgo moderado', high: 'Riesgo alto', critical: 'Riesgo crítico' },
};

const DETECTOR_NAMES = {
  hi: {
    aadhaar: 'आधार संख्या', pan: 'पैन कार्ड नंबर', card: 'बैंक कार्ड नंबर', bank_account: 'बैंक खाता संख्या',
    upi: 'यूपीआई आईडी', ifsc: 'आईएफएससी कोड', email: 'ईमेल पता', phone: 'फ़ोन नंबर',
    password: 'पासवर्ड या गुप्त कुंजी', username: 'यूज़रनेम', cvv: 'सीवीवी सुरक्षा कोड', card_expiry: 'कार्ड समाप्ति तिथि',
    routing_number: 'बैंक राउटिंग नंबर', street_address: 'घर का पता', reference_id: 'कर्मचारी या ग्राहक आईडी',
    dob: 'जन्म तिथि', person_name: 'व्यक्ति का नाम',
    stripe_key: 'सीक्रेट एपीआई कुंजी', ai_key: 'एआई एपीआई कुंजी', google_key: 'गूगल एपीआई कुंजी',
    db_url: 'डेटाबेस कनेक्शन लिंक', jwt: 'सेशन टोकन', bearer: 'ऑथराइजेशन टोकन', ipv4: 'आईपी पता',
  },
  kn: {
    aadhaar: 'ಆಧಾರ್ ಸಂಖ್ಯೆ', pan: 'ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ', card: 'ಬ್ಯಾಂಕ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ', bank_account: 'ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ',
    upi: 'ಯುಪಿಐ ವಿಳಾಸ', ifsc: 'ಐಎಫ್‌ಎಸ್‌ಸಿ ಕೋಡ್', email: 'ಇಮೇಲ್ ವಿಳಾಸ', phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
    password: 'ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ರಹಸ್ಯ ಕೀಲಿ', username: 'ಬಳಕೆದಾರ ಹೆಸರು', cvv: 'ಸಿವಿವಿ ಭದ್ರತಾ ಕೋಡ್', card_expiry: 'ಕಾರ್ಡ್ ಮುಕ್ತಾಯ ದಿನಾಂಕ',
    routing_number: 'ಬ್ಯಾಂಕ್ ರೂಟಿಂಗ್ ಸಂಖ್ಯೆ', street_address: 'ಮನೆ ವಿಳಾಸ', reference_id: 'ಉದ್ಯೋಗಿ ಅಥವಾ ಗ್ರಾಹಕ ಐಡಿ',
    dob: 'ಜನ್ಮ ದಿನಾಂಕ', person_name: 'ವ್ಯಕ್ತಿಯ ಹೆಸರು',
    stripe_key: 'ರಹಸ್ಯ ಎಪಿಐ ಕೀಲಿ', ai_key: 'ಎಐ ಎपीಐ ಕೀಲಿ', google_key: 'ಗೂಗಲ್ ಎಪಿಐ ಕೀಲಿ',
    db_url: 'ಡೇಟಾಬೇಸ್ ವಿಳಾಸ', jwt: 'ಸೆಷನ್ ಟೋಕನ್', bearer: 'ಭದ್ರತಾ ಟೋಕನ್', ipv4: 'ಐಪಿ ವಿಳಾಸ',
  },
  mr: {
    aadhaar: 'आधार क्रमांक', pan: 'पॅन कार्ड क्रमांक', card: 'बँक कार्ड क्रमांक', bank_account: 'बँक खाते क्रमांक',
    upi: 'यूपीआय आयडी', ifsc: 'आयएफएससी कोड', email: 'ईमेल पत्ता', phone: 'फोन नंबर',
    password: 'पासवर्ड किंवा गुप्त की', username: 'युजरनेम', cvv: 'सीव्हीव्ही सुरक्षा कोड', card_expiry: 'कार्ड एक्सपायरी तारीख',
    routing_number: 'बँक राउटिंग नंबर', street_address: 'राहता पत्ता', reference_id: 'कर्मचारी किंवा ग्राहक आयडी',
    dob: 'जन्मतारीख', person_name: 'व्यक्तीचे नाव',
    stripe_key: 'गुप्त एपीआय की', ai_key: 'एआय एपीआय की', google_key: 'गूगल एपीआय की',
    db_url: 'डेटाबेस लिंक', jwt: 'सेशन टोकन', bearer: 'सुरक्षा टोकन', ipv4: 'आयपी पत्ता',
  },
  te: {
    aadhaar: 'ఆధార్ సంఖ్య', pan: 'పాన్ కార్డ్ సంఖ్య', card: 'బ్యాంక్ కార్డ్ సంఖ్య', bank_account: 'బ్యాంక్ ఖాతా సంఖ్య',
    upi: 'యూపీఐ ఐడీ', ifsc: 'ఐఎఫ్ఎస్‌సీ కోడ్', email: 'ఈమెయిల్ చిరునామా', phone: 'ఫోన్ నంబర్',
    password: 'పాస్‌వర్డ్ లేదా రహస్య కీ', username: 'యూజర్‌నేమ్', cvv: 'సీవీవీ భద్రతా కోడ్', card_expiry: 'కార్డ్ గడువు తేదీ',
    routing_number: 'బ్యాంక్ రౌటింగ్ నంబర్', street_address: 'ఇంటి చిరునామా', reference_id: 'ఉద్యోగి లేదా కస్టమర్ ఐడీ',
    dob: 'పుట్టిన తేదీ', person_name: 'వ్యక్తి పేరు',
    stripe_key: 'రహస్య ఏపీఐ కీ', ai_key: 'ఏఐ కీ', google_key: 'గూగుల్ ఏపీఐ కీ',
    db_url: 'డేటాబేస్ లింక్', jwt: 'సెషన్ టోకెన్', bearer: 'భద్రతా టోకెన్', ipv4: 'ఐపీ చిరునామా',
  },
  ta: {
    aadhaar: 'ஆதார் எண்', pan: 'பான் கார்டு எண்', card: 'வங்கி அட்டை எண்', bank_account: 'வங்கி கணக்கு எண்',
    upi: 'யுபிஐ முகவரி', ifsc: 'ஐஎஃப்எஸ்சி குறியீடு', email: 'மின்னஞ்சல் முகவரி', phone: 'தொலைபேசி எண்',
    password: 'கடவுச்சொல் அல்லது ரகசிய குறியீடு', username: 'பயனர்பெயர்', cvv: 'சிவிவி பாதுகாப்பு குறியீடு', card_expiry: 'அட்டை காலாவதி தேதி',
    routing_number: 'வங்கி ரூட்டிங் எண்', street_address: 'வீட்டு முகவரி', reference_id: 'ஊழியர் அல்லது வாடிக்கையாளர் ஐடி',
    dob: 'பிறந்த தேதி', person_name: 'நபரின் பெயர்',
    stripe_key: 'ரகசிய ஏபிஐ திறவுகோல்', ai_key: 'ஏஐ திறவுகோல்', google_key: 'கூகுள் திறவுகோல்',
    db_url: 'தரவுத்தள இணைப்பு', jwt: 'அமர்வு டோக்கன்', bearer: 'பாதுகாப்பு டோக்கன்', ipv4: 'ஐபி முகவரி',
  },
  bn: {
    aadhaar: 'আধার নম্বর', pan: 'প্যান কার্ড নম্বর', card: 'ব্যাংক কার্ড নম্বর', bank_account: 'ব্যাংক অ্যাকাউন্ট নম্বর',
    upi: 'ইউপিআই আইডি', ifsc: 'আইএফএসসি কোড', email: 'ইমেল ঠিকানা', phone: 'ফোন নম্বর',
    password: 'পাসওয়ার্ড বা গোপন কী', username: 'ইউজারনেম', cvv: 'সিভিভি কোড', card_expiry: 'কার্ডের মেয়াদ',
    routing_number: 'ব্যাংক রাউটিং নম্বর', street_address: 'বাড়ির ঠিকানা', reference_id: 'কর্মচারী বা গ্রাহক আইডি',
    dob: 'জন্ম তারিখ', person_name: 'ব্যক্তির নাম',
    stripe_key: 'গোপন এপিআই কী', ai_key: 'এআই কী', google_key: 'গুগল এপিআই কী',
    db_url: 'ডেটাবেস লিঙ্ক', jwt: 'সেশন টোকেন', bearer: 'সিকিউরিটি টোকেন', ipv4: 'আইপি ঠিকানা',
  },
  es: {
    aadhaar: 'número Aadhaar', pan: 'número fiscal PAN', card: 'número de tarjeta bancaria', bank_account: 'número de cuenta bancaria',
    upi: 'identificador UPI', ifsc: 'código bancario IFSC', email: 'correo electrónico', phone: 'número de teléfono',
    password: 'contraseña o clave secreta', username: 'nombre de usuario', cvv: 'código CVV de tarjeta', card_expiry: 'fecha de vencimiento de tarjeta',
    routing_number: 'número de ruta bancaria', street_address: 'dirección postal', reference_id: 'ID de empleado o cliente',
    dob: 'fecha de nacimiento', person_name: 'nombre personal',
    stripe_key: 'clave secreta de API', ai_key: 'clave de proveedor IA', google_key: 'clave de Google API',
    db_url: 'cadena de conexión a base de datos', jwt: 'token de sesión JWT', bearer: 'token de autorización', ipv4: 'dirección IP',
  },
};

export const STRINGS = {
  en: {
    overview: 'Overview',
    scanner: 'Scanner',
    activity: 'Activity',
    detectors: 'Detectors',
    settings: 'Settings',
    scannerSub: 'Paste or speak a prompt in your language. Findings appear as you type, and nothing leaves this browser.',
    yourPrompt: 'Your prompt',
    safePrompt: 'Safe prompt',
    findings: 'Findings',
    uploadFile: 'Upload file',
    clear: 'Hold to clear',
    cleared: 'Cleared',
    voiceInput: 'Speak prompt',
    listening: 'Listening…',
    listenSummary: 'Listen',
    stopAudio: 'Stop',
    copySafe: 'Copy safe prompt',
    saveActivity: 'Save to Activity',
    explainFindings: 'Explain findings',
    rewriteSafely: 'Rewrite safely',
    aiAssist: 'AI assist (Multilingual)',
    restoreReply: 'Restore the reply',
    cleanMsg: 'No known sensitive patterns or injection phrases were found. Still review your prompt once before sharing.',
  },
  hi: {
    overview: 'अवलोकन',
    scanner: 'स्कैनर',
    activity: 'गतिविधि',
    detectors: 'डिटेक्टर',
    settings: 'सेटिंग्स',
    scannerSub: 'अपनी भाषा में प्रॉम्प्ट पेस्ट करें या बोलें। संवेदनशील जानकारी आपके ब्राउज़र में ही सुरक्षित रूप से जाँची जाती है।',
    yourPrompt: 'आपका प्रॉम्प्ट',
    safePrompt: 'सुरक्षित प्रॉम्प्ट',
    findings: 'मिले जोखिम',
    uploadFile: 'फ़ाइल अपलोड करें',
    clear: 'साफ़ करने के लिए दबाए रखें',
    cleared: 'साफ़ हो गया',
    voiceInput: 'बोलकर लिखें',
    listening: 'सुन रहा है…',
    listenSummary: 'सुनें',
    stopAudio: 'रोकें',
    copySafe: 'सुरक्षित प्रॉम्प्ट कॉपी करें',
    saveActivity: 'गतिविधि में सहेजें',
    explainFindings: 'सरल भाषा में समझाइए',
    rewriteSafely: 'सुरक्षित रूप से फिर लिखें',
    aiAssist: 'एआई सहायता (बहुभाषी)',
    restoreReply: 'उत्तर में असली मान वापस लाएँ',
    cleanMsg: 'कोई संवेदनशील डेटा या प्रॉम्प्ट इंजेक्शन नहीं मिला। फिर भी भेजने से पहले एक बार जाँच लें।',
  },
  kn: {
    overview: 'ಅವಲೋಕನ',
    scanner: 'ಸ್ಕ್ಯಾನರ್',
    activity: 'ಚಟುವಟಿಕೆ',
    detectors: 'ಡಿಟೆಕ್ಟರ್‌ಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    scannerSub: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಪ್ರಾಂಪ್ಟ್ ಪೇಸ್ಟ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ. ಎಲ್ಲಾ ಪರಿಶೀಲನೆಗಳು ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ನಡೆಯುತ್ತವೆ.',
    yourPrompt: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್',
    safePrompt: 'ಸುರಕ್ಷಿತ ಪ್ರಾಂಪ್ಟ್',
    findings: 'ಪತ್ತೆಯಾದ ಅಂಶಗಳು',
    uploadFile: 'ಫೈಲ್ ಅಪ್‌ಲೋಡ್',
    clear: 'ಅಳಿಸಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ',
    cleared: 'ಅಳಿಸಲಾಗಿದೆ',
    voiceInput: 'ಮಾತನಾಡಿ',
    listening: 'ಆಲಿಸುತ್ತಿದೆ…',
    listenSummary: 'ಕೇಳಿ',
    stopAudio: 'ನಿಲ್ಲಿಸಿ',
    copySafe: 'ಸುರಕ್ಷಿತ ಪ್ರಾಂಪ್ಟ್ ಕಾಪಿ ಮಾಡಿ',
    saveActivity: 'ಉಳಿಸಿ',
    explainFindings: 'ಸರಳವಾಗಿ ವಿವರಿಸಿ',
    rewriteSafely: 'ಸುರಕ್ಷಿತವಾಗಿ ಮರುಬರೆಯಿರಿ',
    aiAssist: 'ಎಐ ಸಹಾಯ (ಬಹುಭಾಷಾ)',
    restoreReply: 'ಉತ್ತರವನ್ನು ಮರುಸ್ಥಾಪಿಸಿ',
    cleanMsg: 'ಯಾವುದೇ ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ. ಕಳುಹಿಸುವ ಮೊದಲು ಒಮ್ಮೆ ಪರಿಶೀಲಿಸಿ.',
  },
  mr: {
    overview: 'आढावा',
    scanner: 'स्कॅनर',
    activity: 'हालचाली',
    detectors: 'डिटेक्टर्स',
    settings: 'सेटिंग्ज',
    scannerSub: 'तुमच्या भाषेत प्रॉम्प्ट पेस्ट करा किंवा बोला. सर्व तपासणी तुमच्या ब्राउझरमध्येच सुरक्षितपणे होते.',
    yourPrompt: 'तुमचा प्रॉम्प्ट',
    safePrompt: 'सुरक्षित प्रॉम्प्ट',
    findings: 'आढळलेले धोके',
    uploadFile: 'फाइल अपलोड करा',
    clear: 'पुसण्यासाठी दाबून ठेवा',
    cleared: 'पुसले गेले',
    voiceInput: 'बोलून लिहा',
    listening: 'ऐकत आहे…',
    listenSummary: 'ऐका',
    stopAudio: 'थांबा',
    copySafe: 'सुरक्षित प्रॉम्प्ट कॉपी करा',
    saveActivity: 'सेव्ह करा',
    explainFindings: 'सोप्या भाषेत समजावून सांगा',
    rewriteSafely: 'सुरक्षितपणे पुन्हा लिहा',
    aiAssist: 'एआय मदत (बहुभाषिक)',
    restoreReply: 'उत्तर पूर्ववत करा',
    cleanMsg: 'कोणतीही संवेदनशील माहिती आढळली नाही. तरीही पाठवण्यापूर्वी एकदा तपासा.',
  },
  te: {
    overview: 'అవలోకనం',
    scanner: 'స్కానర్',
    activity: 'కార్యాచరణ',
    detectors: 'డిటెక్టర్లు',
    settings: 'సెట్టింగ్‌లు',
    scannerSub: 'మీ భాషలో ప్రాంప్ట్‌ను పేస్ట్ చేయండి లేదా మాట్లాడండి. సున్నితమైన సమాచారం మీ బ్రౌజర్‌లోనే తనిఖీ చేయబడుతుంది.',
    yourPrompt: 'మీ ప్రాంప్ట్',
    safePrompt: 'సురక్షిత ప్రాంప్ట్',
    findings: 'కనుగొన్న అంశాలు',
    uploadFile: 'ఫైల్ అప్‌లోడ్',
    clear: 'క్లియర్ చేయడానికి నొక్కి ఉంచండి',
    cleared: 'క్లియర్ చేయబడింది',
    voiceInput: 'మాట్లాడండి',
    listening: 'వింటోంది…',
    listenSummary: 'వినండి',
    stopAudio: 'ఆపండి',
    copySafe: 'సురక్షిత ప్రాంప్ట్ కాపీ',
    saveActivity: 'సేవ్ చేయండి',
    explainFindings: 'సరళంగా వివరించండి',
    rewriteSafely: 'సురక్షితంగా తిరిగి రాయండి',
    aiAssist: 'ఏఐ సహాయం (బహుభాషా)',
    restoreReply: 'సమాధానాన్ని పునరుద్ధరించండి',
    cleanMsg: 'సున్నితమైన సమాచారం లేదా ఇంజెక్షన్ నమూనాలు కనుగొనబడలేదు. పంపే ముందు ఒకసారి పరిశీలించండి.',
  },
  ta: {
    overview: 'மேலோட்டம்',
    scanner: 'ஸ்கேனர்',
    activity: 'செயல்பாடு',
    detectors: 'கண்டறிப்பான்கள்',
    settings: 'அமைப்புகள்',
    scannerSub: 'உங்கள் மொழியில் ப்ராம்ப்ட்டை ஒட்டவும் அல்லது பேசவும். அனைத்து சோதனைகளும் உங்கள் உலாவியிலேயே நடக்கும்.',
    yourPrompt: 'உங்கள் ப்ராம்ப்ட்',
    safePrompt: 'பாதுகாப்பான ப்ராம்ப்ட்',
    findings: 'கண்டறியப்பட்டவை',
    uploadFile: 'கோப்பு பதிவேற்று',
    clear: 'அழிக்க அழுத்திப் பிடிக்கவும்',
    cleared: 'அழிக்கப்பட்டது',
    voiceInput: 'பேசி உள்ளிடவும்',
    listening: 'கவனிக்கிறது…',
    listenSummary: 'கேட்க',
    stopAudio: 'நிறுத்து',
    copySafe: 'பாதுகாப்பான உரையை நகலெடு',
    saveActivity: 'சேமி',
    explainFindings: 'எளிமையாக விளக்கு',
    rewriteSafely: 'பாதுகாப்பாக மாற்றி எழுது',
    aiAssist: 'ஏஐ உதவி (பல மொழி)',
    restoreReply: 'பதிலை மீட்டெடு',
    cleanMsg: 'பாதுகாப்பு அபாயங்கள் எதுவும் கண்டறியப்படவில்லை. பகிரும் முன் ஒருமுறை சரிபார்க்கவும்.',
  },
  bn: {
    overview: 'ওভারভিউ',
    scanner: 'স্ক্যানার',
    activity: 'অ্যাক্টিভিটি',
    detectors: 'ডিটেক্টর',
    settings: 'সেটিংস',
    scannerSub: 'আপনার ভাষায় প্রম্পট পেস্ট করুন বা বলুন। সব পরীক্ষা আপনার ব্রাউজারেই সম্পন্ন হয়।',
    yourPrompt: 'আপনার প্রম্পট',
    safePrompt: 'নিরাপদ প্রম্পট',
    findings: 'শনাক্তকৃত ঝুঁকি',
    uploadFile: 'ফাইল আপলোড',
    clear: 'মুছে ফেলতে ধরে রাখুন',
    cleared: 'মুছে ফেলা হয়েছে',
    voiceInput: 'কথা বলুন',
    listening: 'শুনছে…',
    listenSummary: 'শুনুন',
    stopAudio: 'থামুন',
    copySafe: 'নিরাপদ প্রম্পট কপি করুন',
    saveActivity: 'সংরক্ষণ করুন',
    explainFindings: 'সহজ ভাষায় বুঝিয়ে বলুন',
    rewriteSafely: 'নিরাপদে পুনরায় লিখুন',
    aiAssist: 'এআই সহায়তা (বহুভাষিক)',
    restoreReply: 'উত্তর পুনরুদ্ধার করুন',
    cleanMsg: 'কোনো সংবেদনশীল তথ্য বা ইনজেকশন পাওয়া যায়নি। পাঠানোর আগে একবার দেখে নিন।',
  },
  es: {
    overview: 'Resumen',
    scanner: 'Escáner',
    activity: 'Actividad',
    detectors: 'Detectores',
    settings: 'Ajustes',
    scannerSub: 'Pega o dicta un prompt en tu idioma. Todo se analiza localmente en tu navegador.',
    yourPrompt: 'Tu prompt',
    safePrompt: 'Prompt seguro',
    findings: 'Hallazgos',
    uploadFile: 'Subir archivo',
    clear: 'Mantén para borrar',
    cleared: 'Borrado',
    voiceInput: 'Dictar',
    listening: 'Escuchando…',
    listenSummary: 'Escuchar',
    stopAudio: 'Detener',
    copySafe: 'Copiar prompt seguro',
    saveActivity: 'Guardar en actividad',
    explainFindings: 'Explicar hallazgos',
    rewriteSafely: 'Reescribir de forma segura',
    aiAssist: 'Asistencia IA (Multilingüe)',
    restoreReply: 'Restaurar respuesta',
    cleanMsg: 'No se encontraron datos sensibles ni patrones de inyección. Revisa el texto antes de enviarlo.',
  },
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] || STRINGS.en[key] || key;
}

export function localizedSummary(result, lang = 'en', fallbackEn = '') {
  if (!lang || lang === 'en') return fallbackEn;
  const { counts, risk, findings } = result;
  if (!counts.total) return t(lang, 'cleanMsg');
  const s = counts.sensitive;
  const inj = counts.injection;
  const score = risk.score;
  const levelText = LEVEL_NAMES[lang]?.[risk.level] || risk.level;
  const topDet = findings[0];
  const topLabel = topDet ? (DETECTOR_NAMES[lang]?.[topDet.detector] || topDet.label) : '';

  const templates = {
    hi: `${levelText} (स्कोर १०० में से ${score}): इस प्रॉम्प्ट में ${s} संवेदनशील जानकारियाँ और ${inj} प्रॉम्प्ट इंजेक्शन संकेत मिले हैं। ${topLabel ? `यहाँ ${topLabel} सबसे संवेदनशील है, कृपया एआई को भेजने से पहले इसे छुपाएँ।` : ''}`,
    kn: `${levelText} (ಅಂಕ ೧೦೦ ಕ್ಕೆ ${score}): ಈ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ${s} ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿಗಳು ಮತ್ತು ${inj} ಇಂಜೆಕ್ಷನ್ ಸಂಕೇತಗಳು ಪತ್ತೆಯಾಗಿವೆ. ${topLabel ? `ಇಲ್ಲಿ ${topLabel} ಅತ್ಯಂತ ಗಂಭೀರವಾಗಿದೆ, ದಯವಿಟ್ಟು ಕಳುಹಿಸುವ ಮೊದಲು ಇದನ್ನು ಮರೆಮಾಡಿ.` : ''}`,
    mr: `${levelText} (गुण १०० पैकी ${score}): या प्रॉम्प्टमध्ये ${s} संवेदनशील माहिती आणि ${inj} प्रॉम्प्ट इंजेक्शन संकेत आढळले आहेत. ${topLabel ? `येथे ${topLabel} सर्वात संवेदनशील आहे, कृपया एआयला पाठवण्यापूर्वी ते लपवा.` : ''}`,
    te: `${levelText} (స్కోరు 100 కి ${score}): ఈ ప్రాంప్ట్‌లో ${s} సున్నితమైన వివరాలు మరియు ${inj} ఇంజెక్షన్ సంకేతాలు కనుగొనబడ్డాయి. ${topLabel ? `ఇందులో ${topLabel} అత్యంత తీవ్రమైనది, దయచేసి పంపే ముందు దీన్ని దాచండి.` : ''}`,
    ta: `${levelText} (மதிப்பெண் 100 க்கு ${score}): இந்த உரையில் ${s} முக்கிய தகவல்கள் மற்றும் ${inj} ஊடுருவல் அறிகுறிகள் கண்டறியப்பட்டுள்ளன. ${topLabel ? `இதில் ${topLabel} மிகவும் ஆபத்தானது, பகிரும் முன் இதை மறைக்கவும்.` : ''}`,
    bn: `${levelText} (স্কোর ১০০ এর মধ্যে ${score}): এই প্রম্পটে ${s}টি সংবেদনশীল তথ্য এবং ${inj}টি ইনজেকশন সংকেত পাওয়া গেছে। ${topLabel ? `এখানে ${topLabel} সবচেয়ে ঝুঁকিপূর্ণ, পাঠানোর আগে এটি লুকিয়ে ফেলুন।` : ''}`,
    es: `${levelText} (puntuación ${score} de 100): se detectaron ${s} datos sensibles y ${inj} señales de inyección. ${topLabel ? `El hallazgo de ${topLabel} es el más delicado; redáctalo antes de enviarlo.` : ''}`,
  };
  return templates[lang] || fallbackEn;
}

let activeAudio = null;
let activeObjectUrl = null;
let activeUtterance = null;
let activeVoiceSession = null;

export function stopSpeaking() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
  if (activeObjectUrl) {
    try { URL.revokeObjectURL(activeObjectUrl); } catch {}
    activeObjectUrl = null;
  }
  activeUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
}

function fallbackBrowserSpeak(cleanText, langCode, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  try { window.speechSynthesis.cancel(); } catch {}
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = utter;
    const langObj = LANG_MAP[langCode] || LANG_MAP.en;
    utter.lang = langObj.bcp47;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const matched = voices.find((v) => v.lang.toLowerCase().startsWith(langObj.code.toLowerCase()));
    if (matched) utter.voice = matched;
    utter.onend = () => {
      if (activeUtterance === utter) activeUtterance = null;
      onEnd?.();
    };
    utter.onerror = () => {
      if (activeUtterance === utter) activeUtterance = null;
      onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  }, 60);
}

export function speakText(text, langCode = 'en', onEnd) {
  stopSpeaking();
  if (!text) {
    onEnd?.();
    return false;
  }

  const cleanText = text.replace(/[*#_`~>-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const ttsUrl = `${API_BASE}/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(cleanText.slice(0, 480))}`;

  fetch(ttsUrl)
    .then(async (res) => {
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob || blob.size < 100) throw new Error('Empty audio blob');
      const objUrl = URL.createObjectURL(blob);
      activeObjectUrl = objUrl;
      const audio = new Audio(objUrl);
      activeAudio = audio;
      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        if (activeObjectUrl === objUrl) {
          URL.revokeObjectURL(objUrl);
          activeObjectUrl = null;
        }
        onEnd?.();
      };
      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        fallbackBrowserSpeak(cleanText, langCode, onEnd);
      };
      await audio.play();
    })
    .catch(() => {
      fallbackBrowserSpeak(cleanText, langCode, onEnd);
    });

  return true;
}

export function stopVoiceInput() {
  if (activeVoiceSession) {
    activeVoiceSession.stop();
    activeVoiceSession = null;
  }
}

export function startVoiceInput(langCode = 'en', { onInterim, onResult, onEnd, onError } = {}) {
  if (typeof window === 'undefined') return null;

  // If already listening, stop it cleanly
  if (activeVoiceSession) {
    stopVoiceInput();
  }

  const langObj = LANG_MAP[langCode] || LANG_MAP.en;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  let stopped = false;
  let gotBrowserSpeech = false;
  let pendingInterim = '';
  let rec = null;
  let mediaRecorder = null;
  let mediaStream = null;
  const audioChunks = [];

  const cleanupStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => {
        try { t.stop(); } catch {}
      });
      mediaStream = null;
    }
  };

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const finishSession = async () => {
    if (stopped) return;
    stopped = true;
    activeVoiceSession = null;

    if (rec) {
      try { rec.onend = null; rec.stop(); } catch {}
    }

    // Flush any uncommitted interim speech immediately so user never loses spoken words
    if (pendingInterim.trim()) {
      gotBrowserSpeech = true;
      onResult?.(pendingInterim.trim());
      pendingInterim = '';
      onInterim?.('');
    }

    // Stop MediaRecorder and, if browser SpeechRecognition didn't capture text, send audio to backend /api/stt
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
        try { mediaRecorder.stop(); } catch { resolve(); }
      });
    }
    cleanupStream();

    if (!gotBrowserSpeech && audioChunks.length > 0) {
      try {
        onInterim?.('Transcribing audio…');
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mimeType });
        if (blob.size > 500) {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch(`${API_BASE}/stt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType, lang: langObj.code }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript?.trim()) {
              gotBrowserSpeech = true;
              onResult?.(data.transcript.trim());
            }
          }
        }
      } catch {
        // ignore fallback error
      } finally {
        onInterim?.('');
      }
    }

    onInterim?.('');
    onEnd?.();
  };

  // Start microphone recording in parallel for permissions + backend STT fallback
  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStream = stream;
        if (typeof window.MediaRecorder !== 'undefined') {
          try {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) audioChunks.push(e.data);
            };
            mediaRecorder.start(250);
          } catch {}
        }
      })
      .catch((err) => {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          onError?.('Microphone permission denied. Please allow microphone access in your browser address bar.');
          finishSession();
        }
      });
  }

  if (SpeechRec) {
    try {
      rec = new SpeechRec();
      rec.lang = langObj.bcp47;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const textPiece = res?.[0]?.transcript || '';
          if (res.isFinal) {
            if (textPiece.trim()) {
              gotBrowserSpeech = true;
              pendingInterim = '';
              onInterim?.('');
              onResult?.(textPiece.trim());
            }
          } else {
            interim += textPiece;
          }
        }
        pendingInterim = interim;
        onInterim?.(interim.trim());
      };

      rec.onerror = (event) => {
        const errCode = event?.error || '';
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          onError?.('Microphone access blocked. Allow microphone permission in your browser.');
          finishSession();
        } else if (errCode === 'audio-capture') {
          onError?.('No microphone found. Connect a microphone and try again.');
          finishSession();
        }
        // For 'network' or 'no-speech', keep MediaRecorder running so backend STT fallback handles it when user stops
      };

      rec.onend = () => {
        if (!stopped && gotBrowserSpeech) {
          finishSession();
        }
      };

      rec.start();
    } catch {
      // SpeechRec failed to start; MediaRecorder + backend STT will handle it
    }
  } else if (!navigator.mediaDevices?.getUserMedia) {
    onError?.('Voice input is not supported in this browser.');
    return null;
  }

  // Auto-stop after 15 seconds if user doesn't click Stop manually
  const autoTimer = setTimeout(() => {
    if (!stopped) finishSession();
  }, 15000);

  const session = {
    stop: () => {
      clearTimeout(autoTimer);
      finishSession();
    },
  };
  activeVoiceSession = session;
  return session;
}
