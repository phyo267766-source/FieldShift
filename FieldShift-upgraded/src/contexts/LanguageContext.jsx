import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Navbar
    dashboard: 'Dashboard',
    myFarm: 'My Farm',
    climateInsights: 'Climate Insights',
    cropRotation: 'Crop Rotation',
    comparePlans: 'Compare Plans',
    reports: 'Reports',
    search: 'Search',
    account: 'Account',

    // Dashboard
    yourFarmInFocus: 'Your farm in focus',
    growSmarter: 'Grow Smarter with NASA Data',
    transformSatellite: 'Transform satellite insights into sustainable farming decisions.',
    analyzeMyFarm: 'Analyze My Farm',
    demoWorkspace: 'DEMO WORKSPACE',
    illustrativeClimate: 'Illustrative climate observations and recommendations. No live NASA connection.',
    avgTemperature: 'Average temperature',
    totalRainfall: 'Total rainfall',
    soilMoisture: 'Soil moisture',
    currentCrop: 'Current crop',
    climateRisk: 'Climate risk',
    yourFarmFromAbove: 'Your farm, from above',
    exploreRegion: 'Explore your selected region in Myanmar.',
    searchFarm: 'Search farm or region',
    selectedLocation: 'Selected location',
    healthyNextSeason: 'Healthy next season',
    giveYourSoil: 'Give your soil a fresh start.',
    legumeSeason: 'A legume season after rice may support nitrogen management and reduce irrigation demand.',
    exploreRotation: 'Explore rotation plan',
    rainfallTrend: 'Rainfall trend',
    temperatureTrend: 'Temperature trend',
    solarRadiation: 'Solar radiation',
    heatStressWatch: 'Heat stress watch • Moderate risk',
    warmDays: 'Warm days are expected in this warm season. Check soil moisture before irrigating and avoid midday field work.',
    reviewClimateRisks: 'Review climate risks',

    // My Farm
    farmManagement: 'Farm management',
    betterPlan: 'A better plan starts with your farm.',
    keepGrowing: 'Keep your growing conditions up to date for more relevant recommendations.',
    farmProfile: 'Farm profile',
    farmName: 'Farm name',
    countryRegion: 'Country and region',
    farmLocation: 'Farm location',
    farmSize: 'Farm size',
    soilType: 'Soil type',
    previousCrop: 'Previous crop',
    irrigationMethod: 'Irrigation method',
    plantingSeason: 'Planting season',
    saveFarmProfile: 'Save Farm Profile',
    updateForm: 'Update Form',
    savedExampleFarm: 'Saved example farm',
    planNextSeason: 'Plan next season',
    pinFarmLocation: 'Pin your farm location',
    chooseLocation: 'Choose location on map',

    // Climate Insights
    earthObservations: 'Earth observations / Climate insights',
    understandClimate: 'Understand your changing climate.',
    seasonalContext: 'Seasonal context for better decisions, from rainfall to root-zone moisture.',
    daily: 'Daily',
    monthly: 'Monthly',
    historicalRainfall: 'Historical Rainfall Analysis',
    temperatureTrends: 'Temperature Trends',
    soilMoistureConditions: 'Soil Moisture Conditions',
    seasonalPatterns: 'Seasonal Climate Patterns',
    climateRiskAssessment: 'Climate Risk Assessment',

    // Crop Rotation
    planForBest: 'Plan for what grows best',
    smartCropRotation: 'Smart Crop Rotation Planner',
    planHealthier: 'Plan healthier soil and more sustainable harvests with climate-informed crop rotations.',
    yourGrowingConditions: 'Your growing conditions',
    selectFarm: 'Select farm',
    analysisMode: 'Analysis mode',
    preferredPlanting: 'Preferred planting season',
    planningPeriod: 'Planning period',
    generatePlan: 'Generate Rotation Plan',
    whyThisRotation: 'Why This Rotation',
    compareRotation: 'Compare rotation plans',
    viewPlanReport: 'View plan report',
    startNewPlan: 'Start new plan',

    // Compare Plans
    threePaths: 'Three paths, one healthier farm',
    compareNextCycle: 'Compare your next growing cycle.',
    exploreTradeoffs: 'Explore the trade-offs before choosing your rotation. All scores are illustrative estimates.',
    overallScore: 'Overall suitability score',
    climateScore: 'Climate score',
    waterDemand: 'Water demand',
    soilHealthBenefits: 'Soil health benefits',
    cropDiversity: 'Crop diversity',
    sustainabilityRisk: 'Sustainability risk',
    viewDetailedAnalysis: 'View Detailed Analysis',
    whyPlanBStands: 'Why Plan B stands out',
    returnToPlanner: 'Return to rotation planner',

    // Reports
    turnInsight: 'Turn insight into action',
    yourFarmReport: 'Your farm, in one clear report.',
    practicalSummary: 'A practical summary for your next season, your team, or your local advisor.',
    generateReport: 'Generate Report',
    downloadPdf: 'Download PDF',
    printReport: 'Print Report',
    farmClimateSummary: 'Farm Climate Summary',
    planComparisonCharts: 'Plan Comparison Charts',

    // Notifications
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications yet',
    allCaughtUp: 'You\'re all caught up! New alerts will appear here.',

    // Account
    profileInfo: 'Profile Information',
    accountSettings: 'Account Settings',
    languagePreferences: 'Language Preferences',
    themePreferences: 'Theme Preferences',
    helpSupport: 'Help & Support',
    aboutFieldshift: 'About FieldShift',
    guestUser: 'Guest User',
    demoAccount: 'Demo Account',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    english: 'English',
    myanmar: 'Myanmar (Burmese)',

    // Chatbot
    chatTitle: 'Farm Assistant',
    chatOnline: 'Online — Ask me anything!',
    chatOffline: 'Offline — Start the backend',
    chatAiPowered: 'AI-Powered',
    chatKnowledgeBase: 'Knowledge Base',
    chatPlaceholder: 'Ask about crops, soil, pests...',
    chatWelcome: "Mingalaba! 🙏 I'm FieldShift's farming assistant. Ask me about crops, soil, pests, weather, or rotation advice for Myanmar!",
    chatNewChat: 'New Chat',
    chatThinking: 'Thinking...',
    chatCopied: 'Copied!',
    chatCopy: 'Copy',
    chatRetry: 'Retry',
    chatNoBackend: "I need the backend server to answer your questions. Please make sure the Flask server is running, then try again!",
    chatError: "Sorry, I couldn't process your question. Please try again.",
    chatFooter: 'FieldShift Farming Assistant',

    // Common
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    noResults: 'No results found',
    tryDifferent: 'Try a different search term',
    monsoon: 'Monsoon',
    seasons: 'seasons',
  },
  mm: {
    // Navbar
    dashboard: 'ဒက်ရှ်ဘုတ်',
    myFarm: 'ကျွန်ုပ်၏ခြံ',
    climateInsights: 'ရာသီဥတုသိမြင်ချက်',
    cropRotation: 'သီးနှံအလှည့်ကျ',
    comparePlans: 'အစီအစဥ်နှိုင်းယှဉ်',
    reports: 'အစီရင်ခံစာ',
    search: 'ရှာရန်',
    account: 'အကောင့်',

    // Dashboard
    yourFarmInFocus: 'သင့်ခြံကိုအာရုံစိုက်ပါ',
    growSmarter: 'NASA ဒေတာဖြင့် ပိုမိုကောင်းမွန်စွာ စိုက်ပျိုးပါ',
    transformSatellite: 'ဂြိုလ်တုအချက်အလက်များကို ရေရှည်တည်တံ့သောစိုက်ပျိုးရေးဆုံးဖြတ်ချက်များအဖြစ် ပြောင်းလဲပါ။',
    analyzeMyFarm: 'ကျွန်ုပ်၏ခြံကိုခွဲခြမ်းစိတ်ဖြာပါ',
    demoWorkspace: 'သရုပ်ပြလုပ်ငန်းခွင်',
    illustrativeClimate: 'သရုပ်ပြရာသီဥတုအချက်အလက်များ။ NASA ချိတ်ဆက်မှုမရှိပါ။',
    avgTemperature: 'ပျမ်းမျှအပူချိန်',
    totalRainfall: 'စုစုပေါင်းမိုးရေချိန်',
    soilMoisture: 'မြေဆီလွှာအစိုဓာတ်',
    currentCrop: 'လက်ရှိသီးနှံ',
    climateRisk: 'ရာသီဥတုအန္တရာယ်',
    yourFarmFromAbove: 'အထက်မှသင့်ခြံ',
    exploreRegion: 'မြန်မာနိုင်ငံတွင်ရွေးချယ်ထားသောဒေသကိုလေ့လာပါ။',
    searchFarm: 'ခြံ သို့မဟုတ် ဒေသရှာရန်',
    selectedLocation: 'ရွေးချယ်ထားသောတည်နေရာ',
    healthyNextSeason: 'နောက်ရာသီကျန်းမာ',
    giveYourSoil: 'သင့်မြေကိုအသစ်စတင်ပါ။',
    legumeSeason: 'ဆန်စပါးပြီးနောက်ပဲစိုက်ရာသီသည် နိုက်ထရိုဂျင်စီမံခန့်ခွဲမှုကိုထောက်ပံ့နိုင်ပါသည်။',
    exploreRotation: 'အလှည့်ကျအစီအစဥ်လေ့လာရန်',
    rainfallTrend: 'မိုးရေချိန်လမ်းကြောင်း',
    temperatureTrend: 'အပူချိန်လမ်းကြောင်း',
    solarRadiation: 'နေရောင်ခြည်',
    heatStressWatch: 'အပူဖိစီးမှုသတိပေးချက် • အတန်အသင့်အန္တရာယ်',
    warmDays: 'ဤပူနွေးသောရာသီတွင် ပူနွေးသောရက်များ မျှော်မှန်းထားပါသည်။',
    reviewClimateRisks: 'ရာသီဥတုအန္တရာယ်များကိုပြန်လည်သုံးသပ်ပါ',

    // My Farm
    farmManagement: 'ခြံစီမံခန့်ခွဲမှု',
    betterPlan: 'ပိုကောင်းသောအစီအစဥ်သည် သင့်ခြံမှစတင်သည်။',
    keepGrowing: 'ဆီလျော်သောအကြံပြုချက်များအတွက် စိုက်ပျိုးမှုအခြေအနေများကို ခေတ်မီအောင်ထားပါ။',
    farmProfile: 'ခြံပရိုဖိုင်',
    farmName: 'ခြံအမည်',
    countryRegion: 'နိုင်ငံနှင့်ဒေသ',
    farmLocation: 'ခြံတည်နေရာ',
    farmSize: 'ခြံအကျယ်အဝန်း',
    soilType: 'မြေအမျိုးအစား',
    previousCrop: 'ယခင်သီးနှံ',
    irrigationMethod: 'ဆည်မြောင်းနည်းလမ်း',
    plantingSeason: 'စိုက်ပျိုးရာသီ',
    saveFarmProfile: 'ခြံပရိုဖိုင်သိမ်းရန်',
    updateForm: 'ပုံစံအသစ်ပြင်ရန်',
    savedExampleFarm: 'သိမ်းဆည်းထားသောဥပမာခြံ',
    planNextSeason: 'နောက်ရာသီအစီအစဥ်ဆွဲရန်',
    pinFarmLocation: 'ခြံတည်နေရာထိုးရန်',
    chooseLocation: 'မြေပုံပေါ်တွင်တည်နေရာရွေးရန်',

    // Climate Insights
    earthObservations: 'ကမ္ဘာ့လေ့လာချက် / ရာသီဥတုသိမြင်ချက်',
    understandClimate: 'သင့်ပြောင်းလဲနေသောရာသီဥတုကိုနားလည်ပါ။',
    seasonalContext: 'မိုးရေချိန်မှအမြစ်ဇုန်အစိုဓာတ်အထိ ပိုမိုကောင်းမွန်သောဆုံးဖြတ်ချက်များအတွက် ရာသီအခြေအနေ။',
    daily: 'နေ့စဥ်',
    monthly: 'လစဥ်',
    historicalRainfall: 'သမိုင်းဝင်မိုးရေချိန်ခွဲခြမ်းစိတ်ဖြာခြင်း',
    temperatureTrends: 'အပူချိန်လမ်းကြောင်းများ',
    soilMoistureConditions: 'မြေဆီလွှာအစိုဓာတ်အခြေအနေ',
    seasonalPatterns: 'ရာသီဥတုပုံစံများ',
    climateRiskAssessment: 'ရာသီဥတုအန္တရာယ်အကဲဖြတ်ခြင်း',

    // Crop Rotation
    planForBest: 'အကောင်းဆုံးစိုက်ပျိုးရန်စီစဉ်ပါ',
    smartCropRotation: 'စမတ်သီးနှံအလှည့်ကျစီစဉ်သူ',
    planHealthier: 'ရာသီဥတုအချက်အလက်ဖြင့် ပိုမိုကျန်းမာသောမြေနှင့် ရေရှည်တည်တံ့သောရိတ်သိမ်းခြင်း။',
    yourGrowingConditions: 'သင့်စိုက်ပျိုးမှုအခြေအနေ',
    selectFarm: 'ခြံရွေးရန်',
    analysisMode: 'ခွဲခြမ်းစိတ်ဖြာမှုမုဒ်',
    preferredPlanting: 'နှစ်သက်သောစိုက်ပျိုးရာသီ',
    planningPeriod: 'စီစဉ်ကာလ',
    generatePlan: 'အစီအစဥ်ဖန်တီးရန်',
    whyThisRotation: 'ဤအလှည့်ကျအဘယ်ကြောင့်',
    compareRotation: 'အလှည့်ကျအစီအစဥ်များနှိုင်းယှဉ်ရန်',
    viewPlanReport: 'အစီအစဥ်အစီရင်ခံစာကြည့်ရန်',
    startNewPlan: 'အစီအစဥ်အသစ်စတင်ရန်',

    // Compare Plans
    threePaths: 'လမ်းကြောင်းသုံးခု၊ ပိုကျန်းမာသောခြံတစ်ခု',
    compareNextCycle: 'သင့်နောက်စိုက်ပျိုးရေးသံသရာကိုနှိုင်းယှဉ်ပါ။',
    exploreTradeoffs: 'သင့်အလှည့်ကျရွေးချယ်မှုမပြုမီ အပေးအယူများကိုလေ့လာပါ။',
    overallScore: 'အလုံးစုံသင့်လျော်မှုရမှတ်',
    climateScore: 'ရာသီဥတုရမှတ်',
    waterDemand: 'ရေလိုအပ်ချက်',
    soilHealthBenefits: 'မြေဆီလွှာကျန်းမာရေးအကျိုးကျေးဇူး',
    cropDiversity: 'သီးနှံမျိုးစုံမှု',
    sustainabilityRisk: 'ရေရှည်တည်တံ့မှုအန္တရာယ်',
    viewDetailedAnalysis: 'အသေးစိတ်ခွဲခြမ်းစိတ်ဖြာမှုကြည့်ရန်',
    whyPlanBStands: 'အစီအစဥ် B ဘာကြောင့်ထူးခြားသနည်း',
    returnToPlanner: 'စီစဉ်သူထံပြန်သွားရန်',

    // Reports
    turnInsight: 'သိမြင်ချက်ကိုလုပ်ဆောင်ချက်အဖြစ်ပြောင်းပါ',
    yourFarmReport: 'သင့်ခြံ၊ ရှင်းလင်းသောအစီရင်ခံစာတစ်ခုတွင်။',
    practicalSummary: 'သင့်နောက်ရာသီ၊ သင့်အဖွဲ့ သို့မဟုတ် သင့်ဒေသဆိုင်ရာအကြံပေးအတွက် လက်တွေ့အကျဉ်းချုပ်။',
    generateReport: 'အစီရင်ခံစာဖန်တီးရန်',
    downloadPdf: 'PDF ဒေါင်းလုဒ်',
    printReport: 'အစီရင်ခံစာပုံနှိပ်ရန်',
    farmClimateSummary: 'ခြံရာသီဥတုအကျဉ်းချုပ်',
    planComparisonCharts: 'အစီအစဥ်နှိုင်းယှဉ်ဇယားများ',

    // Notifications
    notifications: 'အကြောင်းကြားချက်များ',
    markAllRead: 'အားလုံးဖတ်ပြီးဟုမှတ်ရန်',
    noNotifications: 'အကြောင်းကြားချက်မရှိသေးပါ',
    allCaughtUp: 'အားလုံးမြင်ပြီးပါပြီ! သတိပေးချက်အသစ်များဤနေရာတွင်ပေါ်လာပါမည်။',

    // Account
    profileInfo: 'ပရိုဖိုင်အချက်အလက်',
    accountSettings: 'အကောင့်ဆက်တင်များ',
    languagePreferences: 'ဘာသာစကားနှစ်သက်ရာ',
    themePreferences: 'အပြင်အဆင်နှစ်သက်ရာ',
    helpSupport: 'အကူအညီနှင့်ပံ့ပိုးမှု',
    aboutFieldshift: 'FieldShift အကြောင်း',
    guestUser: 'ဧည့်သည်အသုံးပြုသူ',
    demoAccount: 'သရုပ်ပြအကောင့်',
    darkMode: 'အမှောင်မုဒ်',
    lightMode: 'အလင်းမုဒ်',
    english: 'English',
    myanmar: 'မြန်မာ (ဗမာ)',

    // Chatbot
    chatTitle: 'စိုက်ပျိုးရေးအကူအညီ',
    chatOnline: 'အွန်လိုင်း — ဘာမဆိုမေးပါ!',
    chatOffline: 'အော့ဖ်လိုင်း — Backend စတင်ပါ',
    chatAiPowered: 'AI-စွမ်းအင်',
    chatKnowledgeBase: 'ဗဟုသုတအခြေ',
    chatPlaceholder: 'သီးနှံ၊ မြေ၊ ပိုးမွှား အကြောင်းမေးပါ...',
    chatWelcome: 'မင်္ဂလာပါ! 🙏 FieldShift စိုက်ပျိုးရေးအကူအညီဖြစ်ပါတယ်။ မြန်မာနိုင်ငံအတွက် သီးနှံ၊ မြေ၊ ပိုးမွှား၊ ရာသီဥတု သို့မဟုတ် သီးနှံအလှည့်ကျအကြံဥာဏ်များမေးပါ!',
    chatNewChat: 'စကားပြောအသစ်',
    chatThinking: 'စဉ်းစားနေသည်...',
    chatCopied: 'ကူးယူပြီး!',
    chatCopy: 'ကူးယူ',
    chatRetry: 'ထပ်စမ်းရန်',
    chatNoBackend: 'သင့်မေးခွန်းကိုဖြေရန် Backend လိုအပ်ပါသည်။ Flask server ကိုဖွင့်ထားပြီး ထပ်စမ်းပါ!',
    chatError: 'သင့်မေးခွန်းကို ဖြေနိုင်ခြင်းမရှိပါ။ ထပ်စမ်းပါ။',
    chatFooter: 'FieldShift စိုက်ပျိုးရေးအကူအညီ',

    // Common
    close: 'ပိတ်ရန်',
    save: 'သိမ်းရန်',
    cancel: 'ပယ်ဖျက်ရန်',
    loading: 'ဖွင့်နေသည်...',
    noResults: 'ရလဒ်မတွေ့ပါ',
    tryDifferent: 'အခြားရှာဖွေမှုစကားလုံးကိုစမ်းကြည့်ပါ',
    monsoon: 'မုတ်သုံ',
    seasons: 'ရာသီ',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('fieldshift_lang') || 'en';
    } catch { return 'en'; }
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem('fieldshift_lang', l); } catch {}
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
