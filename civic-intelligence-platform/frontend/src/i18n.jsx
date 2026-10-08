import { createContext, useContext, useState } from 'react'
import { Globe } from 'lucide-react'
const D = {
  en: { dashboard: 'Dashboard', report: 'Report Issue', assistant: 'AI Assistant', complaints: 'Complaints', myComplaints: 'My Complaints', map: 'Issue Map', manage: 'Manage', notifications: 'Notifications', logout: 'Logout',
    login: 'Login', register: 'Register', openDash: 'Open dashboard', welcome: 'Welcome back', email: 'Email', password: 'Password', fullName: 'Full name', phone: 'Phone (optional)', createAcc: 'Create citizen account', hello: 'Hello',
    total: 'Total complaints', pending: 'Pending', inprog: 'In progress', resolved: 'Resolved', critical: 'Critical', reportTitle: 'Report a civic issue', title: 'Issue title', description: 'Description', category: 'Category (AI-assisted)',
    suggest: 'Suggest with AI', submit: 'Submit complaint', analysing: 'AI is analysing your complaint…', location: 'Location – tap the map', myLoc: 'My location',
    heroTitle: 'Report. Prioritize. Resolve.', heroSub: 'AI-powered civic intelligence for faster and smarter city problem resolution.', reportBtn: 'Report an Issue',
    st1: 'to report', st2: 'AI priority score', st3: 'departments routed', st4: 'transparent tracking', how: 'How it works', s1: 'Report', s2: 'AI analyses', s3: 'De-duplicate', s4: 'Route to department', s5: 'Verify',
    issues: 'Issues we handle', i1: 'Potholes', i2: 'Garbage', i3: 'Water leaks', i4: 'Drainage', i5: 'Streetlights', i6: 'Fallen trees', benefits: 'Benefits',
    b1: 'Faster resolution for dangerous issues', b2: 'No duplicate work for departments', b3: 'See every step and verify the fix', cta: 'Make your city better today', official: 'Official Civic Issue Portal', searchPh: 'What problem do you want to report?', svc1d: 'Photo, location and AI analysis in under 2 minutes', svc2d: 'Track every status update of your complaints', svc3d: 'See live issues across your city on the map', chatHi: 'Hi! Ask me about your complaints.', chatPh: 'Type your question…' },
  ta: { dashboard: 'டாஷ்போர்டு', report: 'பிரச்சினை பதிவு', assistant: 'AI உதவியாளர்', complaints: 'புகார்கள்', myComplaints: 'என் புகார்கள்', map: 'பிரச்சினை வரைபடம்', manage: 'நிர்வகி', notifications: 'அறிவிப்புகள்', logout: 'வெளியேறு',
    login: 'உள்நுழை', register: 'பதிவு செய்', openDash: 'டாஷ்போர்டு திற', welcome: 'மீண்டும் வரவேற்கிறோம்', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', fullName: 'முழு பெயர்', phone: 'தொலைபேசி (விருப்பம்)', createAcc: 'குடிமகன் கணக்கை உருவாக்கு', hello: 'வணக்கம்',
    total: 'மொத்த புகார்கள்', pending: 'நிலுவையில்', inprog: 'நடந்து கொண்டிருக்கிறது', resolved: 'தீர்க்கப்பட்டது', critical: 'அவசரம்', reportTitle: 'நகர பிரச்சினையை பதிவு செய்', title: 'பிரச்சினை தலைப்பு', description: 'விளக்கம்', category: 'வகை (AI உதவி)',
    suggest: 'AI பரிந்துரை', submit: 'புகாரை சமர்ப்பி', analysing: 'AI ஆய்வு செய்கிறது…', location: 'இடம் – வரைபடத்தில் தொடவும்', myLoc: 'என் இடம்',
    heroTitle: 'புகாரளி. முன்னுரிமை. தீர்வு.', heroSub: 'வேகமான, புத்திசாலித்தனமான நகர பிரச்சினை தீர்வுக்கான AI சார்ந்த குடிமை நுண்ணறிவு.', reportBtn: 'பிரச்சினையை பதிவு செய்',
    st1: 'பதிவு செய்ய', st2: 'AI முன்னுரிமை மதிப்பெண்', st3: 'துறைகளுக்கு அனுப்பல்', st4: 'வெளிப்படையான கண்காணிப்பு', how: 'இது எப்படி செயல்படுகிறது', s1: 'புகாரளி', s2: 'AI பகுப்பாய்வு', s3: 'நகல் நீக்கம்', s4: 'துறைக்கு அனுப்பு', s5: 'சரிபார்',
    issues: 'நாங்கள் கையாளும் பிரச்சினைகள்', i1: 'சாலை குழிகள்', i2: 'குப்பை', i3: 'நீர் கசிவு', i4: 'வடிகால்', i5: 'தெருவிளக்குகள்', i6: 'விழுந்த மரங்கள்', benefits: 'நன்மைகள்',
    b1: 'ஆபத்தான பிரச்சினைகளுக்கு விரைவான தீர்வு', b2: 'துறைகளுக்கு நகல் வேலை இல்லை', b3: 'ஒவ்வொரு படியையும் பார்த்து தீர்வை உறுதிசெய்யலாம்', cta: 'இன்றே உங்கள் நகரை மேம்படுத்துங்கள்', official: 'அதிகாரப்பூர்வ குடிமை புகார் தளம்', searchPh: 'எந்த பிரச்சினையை பதிவு செய்ய வேண்டும்?', svc1d: '2 நிமிடத்தில் புகைப்படம், இடம் மற்றும் AI ஆய்வு', svc2d: 'உங்கள் புகார்களின் ஒவ்வொரு நிலையையும் கண்காணிக்கவும்', svc3d: 'உங்கள் நகரின் பிரச்சினைகளை வரைபடத்தில் பாருங்கள்', chatHi: 'வணக்கம்! உங்கள் புகார்கள் பற்றி கேளுங்கள்.', chatPh: 'உங்கள் கேள்வியை எழுதுங்கள்…' },
  hi: { dashboard: 'डैशबोर्ड', report: 'समस्या दर्ज करें', assistant: 'AI सहायक', complaints: 'शिकायतें', myComplaints: 'मेरी शिकायतें', map: 'समस्या मानचित्र', manage: 'प्रबंधन', notifications: 'सूचनाएं', logout: 'लॉगआउट',
    login: 'लॉगिन', register: 'रजिस्टर', openDash: 'डैशबोर्ड खोलें', welcome: 'वापसी पर स्वागत है', email: 'ईमेल', password: 'पासवर्ड', fullName: 'पूरा नाम', phone: 'फोन (वैकल्पिक)', createAcc: 'नागरिक खाता बनाएं', hello: 'नमस्ते',
    total: 'कुल शिकायतें', pending: 'लंबित', inprog: 'प्रगति में', resolved: 'हल हुई', critical: 'गंभीर', reportTitle: 'नागरिक समस्या दर्ज करें', title: 'समस्या का शीर्षक', description: 'विवरण', category: 'श्रेणी (AI सहायता)',
    suggest: 'AI से सुझाव', submit: 'शिकायत जमा करें', analysing: 'AI विश्लेषण कर रहा है…', location: 'स्थान – मानचित्र पर टैप करें', myLoc: 'मेरा स्थान',
    heroTitle: 'शिकायत. प्राथमिकता. समाधान.', heroSub: 'तेज़ और स्मार्ट शहरी समस्या समाधान के लिए AI-आधारित नागरिक बुद्धिमत्ता।', reportBtn: 'समस्या दर्ज करें',
    st1: 'दर्ज करने में', st2: 'AI प्राथमिकता स्कोर', st3: 'विभागों को रूटिंग', st4: 'पारदर्शी ट्रैकिंग', how: 'यह कैसे काम करता है', s1: 'शिकायत करें', s2: 'AI विश्लेषण', s3: 'डुप्लिकेट जांच', s4: 'विभाग को भेजें', s5: 'सत्यापित करें',
    issues: 'हम किन समस्याओं को संभालते हैं', i1: 'गड्ढे', i2: 'कचरा', i3: 'पानी का रिसाव', i4: 'नाली', i5: 'स्ट्रीटलाइट', i6: 'गिरे पेड़', benefits: 'लाभ',
    b1: 'खतरनाक समस्याओं का तेज़ समाधान', b2: 'विभागों के लिए दोहराव नहीं', b3: 'हर कदम देखें और समाधान की पुष्टि करें', cta: 'आज अपने शहर को बेहतर बनाएं', official: 'आधिकारिक नागरिक शिकायत पोर्टल', searchPh: 'आप कौन सी समस्या दर्ज करना चाहते हैं?', svc1d: '2 मिनट में फोटो, स्थान और AI विश्लेषण', svc2d: 'अपनी शिकायतों की हर स्थिति ट्रैक करें', svc3d: 'अपने शहर की समस्याएं मानचित्र पर देखें', chatHi: 'नमस्ते! अपनी शिकायतों के बारे में पूछें।', chatPh: 'अपना प्रश्न लिखें…' },
}
// To add a language: copy the "en" block above, translate the values, and add it to LANGS below.
export const LANGS = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी' }
const Ctx = createContext({ lang: 'en', setLang: () => {} })
export function LangProvider({ children }) {
  const [lang, set] = useState(localStorage.getItem('lang') || 'en')
  const setLang = l => { localStorage.setItem('lang', l); document.documentElement.lang = l; set(l) }
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}
export const useT = () => { const { lang } = useContext(Ctx); return k => D[lang]?.[k] ?? D.en[k] ?? k }
export function LanguageSwitcher({ dark }) {
  const { lang, setLang } = useContext(Ctx)
  return <label className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm ${dark ? 'bg-white/15 text-white' : 'border bg-white text-slate-700'}`}><Globe size={15} />
    <select value={lang} onChange={e => setLang(e.target.value)} className="bg-transparent focus:outline-none">{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k} className="text-slate-800">{v}</option>)}</select></label>
}
