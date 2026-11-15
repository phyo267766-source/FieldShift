// Myanmar States, Regions, Districts, and key Townships with coordinates
// Bilingual: English and Myanmar (Burmese) names

export const myanmarLocations = [
  // === STATES & REGIONS ===
  // Ayeyarwady Region
  { name: 'Ayeyarwady', nameMm: 'ဧရာဝတီ', type: 'region', lat: 16.0, lon: 95.0, parent: null },
  { name: 'Pathein', nameMm: 'ပုသိမ်', type: 'city', lat: 16.7833, lon: 94.7333, parent: 'Ayeyarwady' },
  { name: 'Hinthada', nameMm: 'ဟင်္သာတ', type: 'township', lat: 17.6333, lon: 95.4667, parent: 'Ayeyarwady' },
  { name: 'Myaungmya', nameMm: 'မြောင်းမြ', type: 'township', lat: 16.5833, lon: 95.2167, parent: 'Ayeyarwady' },
  { name: 'Labutta', nameMm: 'လပွတ်တာ', type: 'township', lat: 16.15, lon: 94.75, parent: 'Ayeyarwady' },
  { name: 'Maubin', nameMm: 'မအူပင်', type: 'township', lat: 16.7333, lon: 95.65, parent: 'Ayeyarwady' },
  { name: 'Pyapon', nameMm: 'ဖျာပုံ', type: 'township', lat: 16.2833, lon: 95.6833, parent: 'Ayeyarwady' },
  { name: 'Bogale', nameMm: 'ဘိုကလေး', type: 'township', lat: 16.2833, lon: 95.3833, parent: 'Ayeyarwady' },
  { name: 'Wakema', nameMm: 'ဝါးခယ်မ', type: 'township', lat: 16.6, lon: 95.1833, parent: 'Ayeyarwady' },

  // Bago Region
  { name: 'Bago', nameMm: 'ပဲခူး', type: 'region', lat: 17.3333, lon: 96.4833, parent: null },
  { name: 'Bago City', nameMm: 'ပဲခူးမြို့', type: 'city', lat: 17.3333, lon: 96.4833, parent: 'Bago' },
  { name: 'Pyay', nameMm: 'ပြည်', type: 'city', lat: 18.8167, lon: 95.2167, parent: 'Bago' },
  { name: 'Taungoo', nameMm: 'တောင်ငူ', type: 'city', lat: 18.95, lon: 96.4333, parent: 'Bago' },
  { name: 'Thayarwady', nameMm: 'သာယာဝတီ', type: 'township', lat: 17.6667, lon: 95.7833, parent: 'Bago' },

  // Magway Region
  { name: 'Magway', nameMm: 'မကွေး', type: 'region', lat: 20.15, lon: 94.9333, parent: null },
  { name: 'Magway City', nameMm: 'မကွေးမြို့', type: 'city', lat: 20.15, lon: 94.9333, parent: 'Magway' },
  { name: 'Pakokku', nameMm: 'ပခုက္ကူ', type: 'city', lat: 21.3333, lon: 95.1, parent: 'Magway' },
  { name: 'Minbu', nameMm: 'မင်းဘူး', type: 'township', lat: 20.1833, lon: 94.8833, parent: 'Magway' },
  { name: 'Thayet', nameMm: 'သရက်', type: 'township', lat: 19.3167, lon: 95.1833, parent: 'Magway' },
  { name: 'Yenangyaung', nameMm: 'ရေနံချောင်း', type: 'township', lat: 20.4667, lon: 94.8833, parent: 'Magway' },

  // Mandalay Region
  { name: 'Mandalay', nameMm: 'မန္တလေး', type: 'region', lat: 21.9747, lon: 96.0836, parent: null },
  { name: 'Mandalay City', nameMm: 'မန္တလေးမြို့', type: 'city', lat: 21.9747, lon: 96.0836, parent: 'Mandalay' },
  { name: 'Meiktila', nameMm: 'မိတ္ထီလာ', type: 'city', lat: 20.8833, lon: 95.8667, parent: 'Mandalay' },
  { name: 'Myingyan', nameMm: 'မြင်ကွင်း', type: 'city', lat: 21.4667, lon: 95.3833, parent: 'Mandalay' },
  { name: 'Kyaukse', nameMm: 'ကျောက်ဆည်', type: 'township', lat: 21.6, lon: 96.1333, parent: 'Mandalay' },
  { name: 'PyinOoLwin', nameMm: 'ပြင်ဦးလွင်', type: 'city', lat: 22.0333, lon: 96.4667, parent: 'Mandalay' },
  { name: 'Amarapura', nameMm: 'အမရပူရ', type: 'township', lat: 21.9, lon: 96.05, parent: 'Mandalay' },
  { name: 'Sintgaing', nameMm: 'စဉ့်ကိုင်', type: 'township', lat: 21.75, lon: 96.05, parent: 'Mandalay' },

  // Sagaing Region
  { name: 'Sagaing', nameMm: 'စစ်ကိုင်း', type: 'region', lat: 21.8833, lon: 95.9833, parent: null },
  { name: 'Sagaing City', nameMm: 'စစ်ကိုင်းမြို့', type: 'city', lat: 21.8833, lon: 95.9833, parent: 'Sagaing' },
  { name: 'Monywa', nameMm: 'မုံရွာ', type: 'city', lat: 21.9167, lon: 95.1333, parent: 'Sagaing' },
  { name: 'Shwebo', nameMm: 'ရွှေဘို', type: 'city', lat: 22.5667, lon: 95.7, parent: 'Sagaing' },
  { name: 'Katha', nameMm: 'ကသာ', type: 'township', lat: 24.1833, lon: 96.3333, parent: 'Sagaing' },
  { name: 'Kanbalu', nameMm: 'ကန့်ဘလူ', type: 'township', lat: 22.7333, lon: 95.85, parent: 'Sagaing' },

  // Tanintharyi Region
  { name: 'Tanintharyi', nameMm: 'တနင်္သာရီ', type: 'region', lat: 12.0667, lon: 99.0, parent: null },
  { name: 'Dawei', nameMm: 'ထားဝယ်', type: 'city', lat: 14.0833, lon: 98.2, parent: 'Tanintharyi' },
  { name: 'Myeik', nameMm: 'မြိတ်', type: 'city', lat: 12.4333, lon: 98.6, parent: 'Tanintharyi' },
  { name: 'Kawthoung', nameMm: 'ကော့သောင်း', type: 'city', lat: 10.0167, lon: 98.55, parent: 'Tanintharyi' },

  // Yangon Region
  { name: 'Yangon', nameMm: 'ရန်ကုန်', type: 'region', lat: 16.8661, lon: 96.1951, parent: null },
  { name: 'Yangon City', nameMm: 'ရန်ကုန်မြို့', type: 'city', lat: 16.8661, lon: 96.1951, parent: 'Yangon' },
  { name: 'Insein', nameMm: 'အင်းစိန်', type: 'township', lat: 16.9, lon: 96.1, parent: 'Yangon' },
  { name: 'Hlaing', nameMm: 'လှိုင်', type: 'township', lat: 16.85, lon: 96.12, parent: 'Yangon' },
  { name: 'Thanlyin', nameMm: 'သန်လျင်', type: 'township', lat: 16.7667, lon: 96.25, parent: 'Yangon' },
  { name: 'Dala', nameMm: 'ဒလ', type: 'township', lat: 16.7667, lon: 96.15, parent: 'Yangon' },
  { name: 'North Okkalapa', nameMm: 'မြောက်ဥက္ကလာပ', type: 'township', lat: 16.9, lon: 96.17, parent: 'Yangon' },
  { name: 'South Okkalapa', nameMm: 'တောင်ဥက္ကလာပ', type: 'township', lat: 16.85, lon: 96.17, parent: 'Yangon' },
  { name: 'Mingaladon', nameMm: 'မင်္ဂလာဒုံ', type: 'township', lat: 17.0, lon: 96.15, parent: 'Yangon' },
  { name: 'Hmawbi', nameMm: 'မှော်ဘီ', type: 'township', lat: 17.1, lon: 96.05, parent: 'Yangon' },

  // Naypyidaw
  { name: 'Naypyidaw', nameMm: 'နေပြည်တော်', type: 'region', lat: 19.7633, lon: 96.0785, parent: null },
  { name: 'Naypyidaw City', nameMm: 'နေပြည်တော်မြို့', type: 'city', lat: 19.7633, lon: 96.0785, parent: 'Naypyidaw' },
  { name: 'Pyinmana', nameMm: 'ပျဉ်းမနား', type: 'township', lat: 19.7333, lon: 96.2, parent: 'Naypyidaw' },

  // Kachin State
  { name: 'Kachin', nameMm: 'ကချင်', type: 'state', lat: 25.3833, lon: 97.3833, parent: null },
  { name: 'Myitkyina', nameMm: 'မြစ်ကြီးနား', type: 'city', lat: 25.3833, lon: 97.3833, parent: 'Kachin' },
  { name: 'Bhamo', nameMm: 'ဗန်းမော်', type: 'city', lat: 24.2667, lon: 97.2333, parent: 'Kachin' },
  { name: 'Putao', nameMm: 'ပူတာအို', type: 'township', lat: 27.3333, lon: 97.4167, parent: 'Kachin' },

  // Kayah State
  { name: 'Kayah', nameMm: 'ကယား', type: 'state', lat: 19.6667, lon: 97.2, parent: null },
  { name: 'Loikaw', nameMm: 'လွိုင်ကော်', type: 'city', lat: 19.6667, lon: 97.2, parent: 'Kayah' },

  // Kayin State
  { name: 'Kayin', nameMm: 'ကရင်', type: 'state', lat: 16.8833, lon: 97.6333, parent: null },
  { name: 'Hpa-An', nameMm: 'ဘားအံ', type: 'city', lat: 16.8833, lon: 97.6333, parent: 'Kayin' },
  { name: 'Myawaddy', nameMm: 'မြဝတီ', type: 'township', lat: 16.6833, lon: 98.5167, parent: 'Kayin' },

  // Chin State
  { name: 'Chin', nameMm: 'ချင်း', type: 'state', lat: 21.3, lon: 93.6167, parent: null },
  { name: 'Hakha', nameMm: 'ဟားခါး', type: 'city', lat: 21.9667, lon: 93.6167, parent: 'Chin' },
  { name: 'Falam', nameMm: 'ဖလမ်း', type: 'township', lat: 22.9167, lon: 93.6667, parent: 'Chin' },

  // Mon State
  { name: 'Mon', nameMm: 'မွန်', type: 'state', lat: 16.4833, lon: 97.6167, parent: null },
  { name: 'Mawlamyine', nameMm: 'မော်လမြိုင်', type: 'city', lat: 16.4833, lon: 97.6167, parent: 'Mon' },
  { name: 'Thaton', nameMm: 'သထုံ', type: 'city', lat: 16.9167, lon: 97.3667, parent: 'Mon' },
  { name: 'Ye', nameMm: 'ရေး', type: 'township', lat: 15.25, lon: 97.85, parent: 'Mon' },

  // Rakhine State
  { name: 'Rakhine', nameMm: 'ရခိုင်', type: 'state', lat: 20.15, lon: 92.8833, parent: null },
  { name: 'Sittwe', nameMm: 'စစ်တွေ', type: 'city', lat: 20.15, lon: 92.8833, parent: 'Rakhine' },
  { name: 'Kyaukpyu', nameMm: 'ကျောက်ဖြူ', type: 'township', lat: 19.4333, lon: 93.55, parent: 'Rakhine' },
  { name: 'Thandwe', nameMm: 'သံတွဲ', type: 'township', lat: 18.4667, lon: 94.3667, parent: 'Rakhine' },

  // Shan State
  { name: 'Shan', nameMm: 'ရှမ်း', type: 'state', lat: 20.7833, lon: 97.0333, parent: null },
  { name: 'Taunggyi', nameMm: 'တောင်ကြီး', type: 'city', lat: 20.7833, lon: 97.0333, parent: 'Shan' },
  { name: 'Lashio', nameMm: 'လားရှိုး', type: 'city', lat: 22.9333, lon: 97.75, parent: 'Shan' },
  { name: 'Kengtung', nameMm: 'ကျိုင်းတုံ', type: 'city', lat: 21.2833, lon: 99.6, parent: 'Shan' },
  { name: 'Nyaungshwe', nameMm: 'ညောင်ရွှေ', type: 'township', lat: 20.6667, lon: 96.9333, parent: 'Shan' },
  { name: 'Kalaw', nameMm: 'ကလော', type: 'township', lat: 20.6333, lon: 96.5667, parent: 'Shan' },
  { name: 'Hsipaw', nameMm: 'သီပေါ', type: 'township', lat: 22.6167, lon: 97.3, parent: 'Shan' },
  { name: 'Inle Lake', nameMm: 'အင်းလေးကန်', type: 'landmark', lat: 20.5333, lon: 96.9, parent: 'Shan' },
  { name: 'Tachileik', nameMm: 'တာချီလိတ်', type: 'township', lat: 20.45, lon: 99.8833, parent: 'Shan' },
];

// Search function supporting English and Myanmar
export function searchLocations(query, limit = 10) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();

  const results = myanmarLocations.filter(loc => {
    return (
      loc.name.toLowerCase().includes(q) ||
      (loc.nameMm && loc.nameMm.includes(query.trim())) ||
      (loc.parent && loc.parent.toLowerCase().includes(q)) ||
      (loc.type && loc.type.toLowerCase().includes(q))
    );
  });

  // Sort: exact start matches first, then by type priority
  const typePriority = { region: 0, state: 0, city: 1, township: 2, landmark: 3 };
  results.sort((a, b) => {
    const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStart !== bStart) return aStart - bStart;
    return (typePriority[a.type] || 4) - (typePriority[b.type] || 4);
  });

  return results.slice(0, limit);
}

// All searchable items for the global search (pages, features, etc.)
export const searchablePages = [
  { name: 'Dashboard', nameMm: 'ဒက်ရှ်ဘုတ်', path: '/', type: 'page', description: 'Farm overview and climate summary' },
  { name: 'My Farm', nameMm: 'ကျွန်ုပ်၏ခြံ', path: '/my-farm', type: 'page', description: 'Farm profile and settings' },
  { name: 'Climate Insights', nameMm: 'ရာသီဥတုသိမြင်ချက်', path: '/climate-insights', type: 'page', description: 'Climate analysis and risk assessment' },
  { name: 'Crop Rotation', nameMm: 'သီးနှံအလှည့်ကျစိုက်ပျိုးခြင်း', path: '/crop-rotation', type: 'page', description: 'Smart crop rotation planner' },
  { name: 'Compare Plans', nameMm: 'အစီအစဥ်များနှိုင်းယှဉ်ရန်', path: '/compare-plans', type: 'page', description: 'Compare rotation plans side by side' },
  { name: 'Reports', nameMm: 'အစီရင်ခံစာများ', path: '/reports', type: 'page', description: 'Generate and download farm reports' },
  { name: 'Rainfall Analysis', nameMm: 'မိုးရေချိန်ခွဲခြမ်းစိတ်ဖြာခြင်း', path: '/climate-insights', type: 'feature', description: 'Historical rainfall data and trends' },
  { name: 'Temperature Trends', nameMm: 'အပူချိန်လမ်းကြောင်းများ', path: '/climate-insights', type: 'feature', description: 'Temperature analysis over time' },
  { name: 'Soil Moisture', nameMm: 'မြေဆီလွှာအစိုဓာတ်', path: '/climate-insights', type: 'feature', description: 'Soil moisture conditions' },
  { name: 'Climate Risk Assessment', nameMm: 'ရာသီဥတုအန္တရာယ်အကဲဖြတ်ခြင်း', path: '/climate-insights', type: 'feature', description: 'Drought, heat stress, and flood risks' },
  { name: 'Farm Report', nameMm: 'ခြံအစီရင်ခံစာ', path: '/reports', type: 'feature', description: 'Download your farm summary report' },
];
