/**
 * Myanmar Administrative Divisions — validated dataset
 * 7 States, 7 Regions, 1 Union Territory (Naypyidaw)
 * Structure: State/Region → District → Township
 * Each entry includes GPS coordinates for farm location mapping.
 */

export const myanmarAdmin = {
  // ═══════════════════════════════════════════════
  //  REGIONS (7)
  // ═══════════════════════════════════════════════

  'Ayeyarwady': {
    nameMm: 'ဧရာဝတီတိုင်းဒေသကြီး', type: 'region', lat: 16.0, lon: 95.0,
    districts: {
      'Pathein': {
        nameMm: 'ပုသိမ်ခရိုင်', lat: 16.78, lon: 94.73,
        townships: [
          { name: 'Pathein', nameMm: 'ပုသိမ်', lat: 16.78, lon: 94.73 },
          { name: 'Kangyidaunt', nameMm: 'ကန်ကြီးထောင့်', lat: 16.83, lon: 95.02 },
          { name: 'Ngapudaw', nameMm: 'ငပုတော', lat: 16.08, lon: 94.33 },
          { name: 'Thabaung', nameMm: 'သာပေါင်း', lat: 17.02, lon: 94.73 },
        ]
      },
      'Hinthada': {
        nameMm: 'ဟင်္သာတခရိုင်', lat: 17.63, lon: 95.47,
        townships: [
          { name: 'Hinthada', nameMm: 'ဟင်္သာတ', lat: 17.63, lon: 95.47 },
          { name: 'Zalun', nameMm: 'ဇလွန်', lat: 17.43, lon: 95.42 },
          { name: 'Lemyethna', nameMm: 'လေးမျက်နှာ', lat: 17.5, lon: 95.17 },
          { name: 'Ingapu', nameMm: 'အင်္ဂပူ', lat: 17.78, lon: 95.37 },
        ]
      },
      'Myaungmya': {
        nameMm: 'မြောင်းမြခရိုင်', lat: 16.58, lon: 95.22,
        townships: [
          { name: 'Myaungmya', nameMm: 'မြောင်းမြ', lat: 16.58, lon: 95.22 },
          { name: 'Einme', nameMm: 'အိမ်မဲ', lat: 16.72, lon: 95.38 },
          { name: 'Wakema', nameMm: 'ဝါးခယ်မ', lat: 16.6, lon: 95.18 },
          { name: 'Labutta', nameMm: 'လပွတ္တာ', lat: 16.15, lon: 94.75 },
        ]
      },
      'Maubin': {
        nameMm: 'မအူပင်ခရိုင်', lat: 16.73, lon: 95.65,
        townships: [
          { name: 'Maubin', nameMm: 'မအူပင်', lat: 16.73, lon: 95.65 },
          { name: 'Pantanaw', nameMm: 'ပန်းတနော်', lat: 16.83, lon: 95.47 },
          { name: 'Nyaungdon', nameMm: 'ညောင်တုန်း', lat: 17.07, lon: 95.65 },
          { name: 'Danubyu', nameMm: 'ဓနုဖြူ', lat: 17.1, lon: 95.48 },
        ]
      },
      'Pyapon': {
        nameMm: 'ဖျာပုံခရိုင်', lat: 16.28, lon: 95.68,
        townships: [
          { name: 'Pyapon', nameMm: 'ဖျာပုံ', lat: 16.28, lon: 95.68 },
          { name: 'Bogale', nameMm: 'ဘိုကလေး', lat: 16.28, lon: 95.38 },
          { name: 'Dedaye', nameMm: 'ဒေးဒရဲ', lat: 16.08, lon: 95.87 },
          { name: 'Kyaiklat', nameMm: 'ကျိုက်လတ်', lat: 16.45, lon: 95.72 },
        ]
      },
    }
  },

  'Bago': {
    nameMm: 'ပဲခူးတိုင်းဒေသကြီး', type: 'region', lat: 17.33, lon: 96.48,
    districts: {
      'Bago': {
        nameMm: 'ပဲခူးခရိုင်', lat: 17.33, lon: 96.48,
        townships: [
          { name: 'Bago', nameMm: 'ပဲခူး', lat: 17.33, lon: 96.48 },
          { name: 'Kawa', nameMm: 'ကဝ', lat: 17.08, lon: 96.42 },
          { name: 'Thanatpin', nameMm: 'သနပ်ပင်', lat: 17.28, lon: 96.57 },
          { name: 'Waw', nameMm: 'ဝေါ', lat: 17.45, lon: 96.62 },
          { name: 'DaikU', nameMm: 'ဒိုက်ဦး', lat: 17.6, lon: 96.72 },
          { name: 'Shwegyin', nameMm: 'ရွှေကျင်', lat: 17.95, lon: 96.9 },
        ]
      },
      'Taungoo': {
        nameMm: 'တောင်ငူခရိုင်', lat: 18.95, lon: 96.43,
        townships: [
          { name: 'Taungoo', nameMm: 'တောင်ငူ', lat: 18.95, lon: 96.43 },
          { name: 'Yedashe', nameMm: 'ရေတာရှည်', lat: 18.83, lon: 96.33 },
          { name: 'Kyaukkyi', nameMm: 'ကျောက်ကြီး', lat: 18.57, lon: 96.83 },
          { name: 'Pyu', nameMm: 'ဖြူး', lat: 18.48, lon: 96.43 },
          { name: 'Oktwin', nameMm: 'အုတ်တွင်း', lat: 18.73, lon: 96.42 },
        ]
      },
      'Pyay': {
        nameMm: 'ပြည်ခရိုင်', lat: 18.82, lon: 95.22,
        townships: [
          { name: 'Pyay', nameMm: 'ပြည်', lat: 18.82, lon: 95.22 },
          { name: 'Paukkaung', nameMm: 'ပေါက်ခေါင်း', lat: 18.82, lon: 95.53 },
          { name: 'Padaung', nameMm: 'ပဒေါင်း', lat: 18.73, lon: 95.68 },
          { name: 'Shwedaung', nameMm: 'ရွှေတောင်', lat: 18.72, lon: 95.17 },
        ]
      },
      'Thayarwady': {
        nameMm: 'သာယာဝတီခရိုင်', lat: 17.67, lon: 95.78,
        townships: [
          { name: 'Thayarwady', nameMm: 'သာယာဝတီ', lat: 17.67, lon: 95.78 },
          { name: 'Letpadan', nameMm: 'လက်ပံတန်း', lat: 17.78, lon: 95.75 },
          { name: 'Minhla', nameMm: 'မင်းလှ', lat: 17.95, lon: 95.63 },
          { name: 'Okpho', nameMm: 'အုတ်ဖို', lat: 17.85, lon: 95.95 },
          { name: 'Gyobingauk', nameMm: 'ကြို့ပင်ကောက်', lat: 17.68, lon: 95.58 },
        ]
      },
    }
  },

  'Magway': {
    nameMm: 'မကွေးတိုင်းဒေသကြီး', type: 'region', lat: 20.15, lon: 94.93,
    districts: {
      'Magway': {
        nameMm: 'မကွေးခရိုင်', lat: 20.15, lon: 94.93,
        townships: [
          { name: 'Magway', nameMm: 'မကွေး', lat: 20.15, lon: 94.93 },
          { name: 'Yenangyaung', nameMm: 'ရေနံချောင်း', lat: 20.47, lon: 94.88 },
          { name: 'Chauk', nameMm: 'ချောက်', lat: 20.9, lon: 94.82 },
          { name: 'Taungdwingyi', nameMm: 'တောင်တွင်းကြီး', lat: 20.0, lon: 95.55 },
          { name: 'Natmauk', nameMm: 'နတ်မောက်', lat: 20.2, lon: 95.42 },
          { name: 'Myothit', nameMm: 'မြို့သစ်', lat: 20.13, lon: 95.17 },
        ]
      },
      'Minbu': {
        nameMm: 'မင်းဘူးခရိုင်', lat: 20.18, lon: 94.88,
        townships: [
          { name: 'Minbu', nameMm: 'မင်းဘူး', lat: 20.18, lon: 94.88 },
          { name: 'Pwintbyu', nameMm: 'ပွင့်ဖြူ', lat: 20.33, lon: 94.72 },
          { name: 'Salin', nameMm: 'စလင်း', lat: 19.82, lon: 94.75 },
          { name: 'Ngape', nameMm: 'ငဖဲ', lat: 19.57, lon: 94.57 },
        ]
      },
      'Pakokku': {
        nameMm: 'ပခုက္ကူခရိုင်', lat: 21.33, lon: 95.1,
        townships: [
          { name: 'Pakokku', nameMm: 'ပခုက္ကူ', lat: 21.33, lon: 95.1 },
          { name: 'Yesagyo', nameMm: 'ရေစကြို', lat: 21.62, lon: 95.0 },
          { name: 'Myaing', nameMm: 'မြိုင်', lat: 21.07, lon: 95.33 },
          { name: 'Pauk', nameMm: 'ပေါက်', lat: 21.45, lon: 94.48 },
          { name: 'Seikphyu', nameMm: 'ဆိပ်ဖြူ', lat: 20.7, lon: 94.57 },
        ]
      },
      'Thayet': {
        nameMm: 'သရက်ခရိုင်', lat: 19.32, lon: 95.18,
        townships: [
          { name: 'Thayet', nameMm: 'သရက်', lat: 19.32, lon: 95.18 },
          { name: 'Minhla', nameMm: 'မင်းလှ', lat: 19.18, lon: 95.13 },
          { name: 'Aunglan', nameMm: 'အောင်လံ', lat: 19.38, lon: 95.23 },
          { name: 'Kamma', nameMm: 'ကမ္မ', lat: 19.72, lon: 95.33 },
          { name: 'Sinbaungwe', nameMm: 'ဆင်ပေါင်ဝဲ', lat: 19.05, lon: 95.3 },
        ]
      },
    }
  },

  'Mandalay': {
    nameMm: 'မန္တလေးတိုင်းဒေသကြီး', type: 'region', lat: 21.97, lon: 96.08,
    districts: {
      'Mandalay': {
        nameMm: 'မန္တလေးခရိုင်', lat: 21.97, lon: 96.08,
        townships: [
          { name: 'Aungmyaythazan', nameMm: 'အောင်မြေသာဇံ', lat: 21.97, lon: 96.08 },
          { name: 'Chanayethazan', nameMm: 'ချမ်းအေးသာဇံ', lat: 21.95, lon: 96.08 },
          { name: 'Mahaaungmye', nameMm: 'မဟာအောင်မြေ', lat: 21.93, lon: 96.07 },
          { name: 'Chanmyathazi', nameMm: 'ချမ်းမြသာစည်', lat: 21.93, lon: 96.12 },
          { name: 'Pyigyidagun', nameMm: 'ပြည်ကြီးတံခွန်', lat: 21.92, lon: 96.15 },
          { name: 'Amarapura', nameMm: 'အမရပူရ', lat: 21.9, lon: 96.05 },
          { name: 'Patheingyi', nameMm: 'ပုသိမ်ကြီး', lat: 22.0, lon: 96.18 },
        ]
      },
      'PyinOoLwin': {
        nameMm: 'ပြင်ဦးလွင်ခရိုင်', lat: 22.03, lon: 96.47,
        townships: [
          { name: 'PyinOoLwin', nameMm: 'ပြင်ဦးလွင်', lat: 22.03, lon: 96.47 },
          { name: 'Madaya', nameMm: 'မတ္တရာ', lat: 22.32, lon: 96.18 },
          { name: 'Singu', nameMm: 'စဉ့်ကူ', lat: 22.72, lon: 96.27 },
          { name: 'Mogok', nameMm: 'မိုးကုတ်', lat: 22.92, lon: 96.5 },
        ]
      },
      'Kyaukse': {
        nameMm: 'ကျောက်ဆည်ခရိုင်', lat: 21.6, lon: 96.13,
        townships: [
          { name: 'Kyaukse', nameMm: 'ကျောက်ဆည်', lat: 21.6, lon: 96.13 },
          { name: 'Sintgaing', nameMm: 'စဉ့်ကိုင်', lat: 21.75, lon: 96.05 },
          { name: 'Myittha', nameMm: 'မြစ်သား', lat: 21.48, lon: 96.07 },
          { name: 'Tada-U', nameMm: 'တံတားဦး', lat: 21.87, lon: 96.02 },
        ]
      },
      'Meiktila': {
        nameMm: 'မိတ္ထီလာခရိုင်', lat: 20.88, lon: 95.87,
        townships: [
          { name: 'Meiktila', nameMm: 'မိတ္ထီလာ', lat: 20.88, lon: 95.87 },
          { name: 'Thazi', nameMm: 'သာစည်', lat: 20.68, lon: 96.03 },
          { name: 'Wundwin', nameMm: 'ဝမ်းတွင်း', lat: 21.12, lon: 96.05 },
          { name: 'Mahlaing', nameMm: 'မလှိုင်', lat: 20.73, lon: 95.7 },
        ]
      },
      'Myingyan': {
        nameMm: 'မြင်ကွင်းခရိုင်', lat: 21.47, lon: 95.38,
        townships: [
          { name: 'Myingyan', nameMm: 'မြင်ကွင်း', lat: 21.47, lon: 95.38 },
          { name: 'Taungtha', nameMm: 'တောင်သာ', lat: 21.22, lon: 95.47 },
          { name: 'Natogyi', nameMm: 'နွားထိုးကြီး', lat: 21.27, lon: 95.72 },
          { name: 'Ngazun', nameMm: 'ငါ့ဇွန်', lat: 21.53, lon: 95.63 },
          { name: 'Kyaukpadaung', nameMm: 'ကျောက်ပန်းတောင်း', lat: 20.92, lon: 95.13 },
        ]
      },
    }
  },

  'Sagaing': {
    nameMm: 'စစ်ကိုင်းတိုင်းဒေသကြီး', type: 'region', lat: 21.88, lon: 95.98,
    districts: {
      'Sagaing': {
        nameMm: 'စစ်ကိုင်းခရိုင်', lat: 21.88, lon: 95.98,
        townships: [
          { name: 'Sagaing', nameMm: 'စစ်ကိုင်း', lat: 21.88, lon: 95.98 },
          { name: 'Myinmu', nameMm: 'မြင်းမူ', lat: 21.72, lon: 95.53 },
          { name: 'Myaung', nameMm: 'မြောင်', lat: 21.93, lon: 95.4 },
        ]
      },
      'Monywa': {
        nameMm: 'မုံရွာခရိုင်', lat: 21.92, lon: 95.13,
        townships: [
          { name: 'Monywa', nameMm: 'မုံရွာ', lat: 21.92, lon: 95.13 },
          { name: 'Budalin', nameMm: 'ဘုတလင်', lat: 21.98, lon: 95.13 },
          { name: 'Ayadaw', nameMm: 'အရာတော်', lat: 21.67, lon: 95.17 },
          { name: 'Chaung-U', nameMm: 'ချောင်းဦး', lat: 21.63, lon: 95.37 },
        ]
      },
      'Shwebo': {
        nameMm: 'ရွှေဘိုခရိုင်', lat: 22.57, lon: 95.7,
        townships: [
          { name: 'Shwebo', nameMm: 'ရွှေဘို', lat: 22.57, lon: 95.7 },
          { name: 'KhinU', nameMm: 'ခင်ဦး', lat: 22.63, lon: 95.93 },
          { name: 'Wetlet', nameMm: 'ဝက်လက်', lat: 22.3, lon: 95.85 },
          { name: 'Ye-U', nameMm: 'ရေဦး', lat: 22.78, lon: 95.53 },
        ]
      },
      'Katha': {
        nameMm: 'ကသာခရိုင်', lat: 24.18, lon: 96.33,
        townships: [
          { name: 'Katha', nameMm: 'ကသာ', lat: 24.18, lon: 96.33 },
          { name: 'Indaw', nameMm: 'အင်တော', lat: 24.0, lon: 96.27 },
          { name: 'Banmauk', nameMm: 'ဗန်းမောက်', lat: 24.23, lon: 96.02 },
        ]
      },
    }
  },

  'Tanintharyi': {
    nameMm: 'တနင်္သာရီတိုင်းဒေသကြီး', type: 'region', lat: 14.08, lon: 98.2,
    districts: {
      'Dawei': {
        nameMm: 'ထားဝယ်ခရိုင်', lat: 14.08, lon: 98.2,
        townships: [
          { name: 'Dawei', nameMm: 'ထားဝယ်', lat: 14.08, lon: 98.2 },
          { name: 'Launglon', nameMm: 'လောင်းလုံ', lat: 13.97, lon: 98.15 },
          { name: 'Thayetchaung', nameMm: 'သရက်ချောင်း', lat: 13.73, lon: 98.35 },
          { name: 'Yebyu', nameMm: 'ရေဖြူ', lat: 14.42, lon: 98.18 },
        ]
      },
      'Myeik': {
        nameMm: 'မြိတ်ခရိုင်', lat: 12.43, lon: 98.6,
        townships: [
          { name: 'Myeik', nameMm: 'မြိတ်', lat: 12.43, lon: 98.6 },
          { name: 'Palaw', nameMm: 'ပုလဲ', lat: 12.92, lon: 98.63 },
          { name: 'Tanintharyi', nameMm: 'တနင်္သာရီ', lat: 12.08, lon: 99.02 },
          { name: 'Kyunsu', nameMm: 'ကျွန်းစု', lat: 11.75, lon: 98.7 },
        ]
      },
      'Kawthoung': {
        nameMm: 'ကော့သောင်းခရိုင်', lat: 10.02, lon: 98.55,
        townships: [
          { name: 'Kawthoung', nameMm: 'ကော့သောင်း', lat: 10.02, lon: 98.55 },
          { name: 'Bokpyin', nameMm: 'ဘုတ်ပြင်း', lat: 11.15, lon: 98.75 },
        ]
      },
    }
  },

  'Yangon': {
    nameMm: 'ရန်ကုန်တိုင်းဒေသကြီး', type: 'region', lat: 16.87, lon: 96.2,
    districts: {
      'Yangon East': {
        nameMm: 'ရန်ကုန်အရှေ့ပိုင်းခရိုင်', lat: 16.85, lon: 96.22,
        townships: [
          { name: 'Botataung', nameMm: 'ဗိုလ်တထောင်', lat: 16.87, lon: 96.17 },
          { name: 'Pazundaung', nameMm: 'ပုဇွန်တောင်', lat: 16.87, lon: 96.18 },
          { name: 'Tamwe', nameMm: 'တာမွေ', lat: 16.87, lon: 96.2 },
          { name: 'Mingala Taungnyunt', nameMm: 'မင်္ဂလာတောင်ညွန့်', lat: 16.86, lon: 96.18 },
          { name: 'South Okkalapa', nameMm: 'တောင်ဥက္ကလာပ', lat: 16.85, lon: 96.17 },
          { name: 'North Okkalapa', nameMm: 'မြောက်ဥက္ကလာပ', lat: 16.9, lon: 96.17 },
          { name: 'Thaketa', nameMm: 'သာကေတ', lat: 16.83, lon: 96.22 },
          { name: 'Dawbon', nameMm: 'ဒေါပုံ', lat: 16.83, lon: 96.2 },
          { name: 'Thingangyun', nameMm: 'သင်္ဃန်းကျွန်း', lat: 16.85, lon: 96.2 },
          { name: 'Yankin', nameMm: 'ရန်ကင်း', lat: 16.88, lon: 96.15 },
        ]
      },
      'Yangon West': {
        nameMm: 'ရန်ကုန်အနောက်ပိုင်းခရိုင်', lat: 16.87, lon: 96.13,
        townships: [
          { name: 'Latha', nameMm: 'လသာ', lat: 16.87, lon: 96.15 },
          { name: 'Lanmadaw', nameMm: 'လမ်းမတော်', lat: 16.87, lon: 96.14 },
          { name: 'Kyimyindaing', nameMm: 'ကြည့်မြင်တိုင်', lat: 16.87, lon: 96.13 },
          { name: 'Sanchaung', nameMm: 'စမ်းချောင်း', lat: 16.86, lon: 96.14 },
          { name: 'Hlaing', nameMm: 'လှိုင်', lat: 16.85, lon: 96.12 },
          { name: 'Kamayut', nameMm: 'ကမာရွတ်', lat: 16.86, lon: 96.12 },
          { name: 'Bahan', nameMm: 'ဗဟန်း', lat: 16.85, lon: 96.15 },
          { name: 'Dagon', nameMm: 'ဒဂုံ', lat: 16.87, lon: 96.15 },
        ]
      },
      'Yangon South': {
        nameMm: 'ရန်ကုန်တောင်ပိုင်းခရိုင်', lat: 16.77, lon: 96.18,
        townships: [
          { name: 'Dala', nameMm: 'ဒလ', lat: 16.77, lon: 96.15 },
          { name: 'Seikkyi Kanaungto', nameMm: 'ဆိပ်ကြီးခနောင်တို', lat: 16.73, lon: 96.15 },
          { name: 'Thanlyin', nameMm: 'သန်လျင်', lat: 16.77, lon: 96.25 },
          { name: 'Kyauktan', nameMm: 'ကျောက်တန်း', lat: 16.65, lon: 96.43 },
        ]
      },
      'Yangon North': {
        nameMm: 'ရန်ကုန်မြောက်ပိုင်းခရိုင်', lat: 17.0, lon: 96.15,
        townships: [
          { name: 'Insein', nameMm: 'အင်းစိန်', lat: 16.9, lon: 96.1 },
          { name: 'Mingaladon', nameMm: 'မင်္ဂလာဒုံ', lat: 17.0, lon: 96.15 },
          { name: 'Hmawbi', nameMm: 'မှော်ဘီ', lat: 17.1, lon: 96.05 },
          { name: 'Hlegu', nameMm: 'လှည်းကူး', lat: 17.18, lon: 96.18 },
          { name: 'Taikkyi', nameMm: 'တိုက်ကြီး', lat: 17.35, lon: 95.97 },
          { name: 'Shwepyitha', nameMm: 'ရွှေပြည်သာ', lat: 16.93, lon: 96.13 },
          { name: 'Hlaingthaya', nameMm: 'လှိုင်သာယာ', lat: 16.88, lon: 96.07 },
        ]
      },
    }
  },

  // ═══════════════════════════════════════════════
  //  UNION TERRITORY
  // ═══════════════════════════════════════════════

  'Naypyidaw': {
    nameMm: 'နေပြည်တော်ပြည်ထောင်စုနယ်မြေ', type: 'union_territory', lat: 19.76, lon: 96.08,
    districts: {
      'Ottara': {
        nameMm: 'ဥတ္တရခရိုင်', lat: 19.88, lon: 96.13,
        townships: [
          { name: 'Ottarathiri', nameMm: 'ဥတ္တရသီရိ', lat: 19.88, lon: 96.13 },
          { name: 'Pobbathiri', nameMm: 'ပုဗ္ဗသီရိ', lat: 19.82, lon: 96.2 },
          { name: 'Pyinmana', nameMm: 'ပျဉ်းမနား', lat: 19.73, lon: 96.2 },
          { name: 'Tatkon', nameMm: 'တပ်ကုန်း', lat: 19.6, lon: 96.28 },
        ]
      },
      'Dekkhina': {
        nameMm: 'ဒက္ခိဏခရိုင်', lat: 19.7, lon: 96.0,
        townships: [
          { name: 'Dekkhinathiri', nameMm: 'ဒက္ခိဏသီရိ', lat: 19.7, lon: 96.0 },
          { name: 'Zabuthiri', nameMm: 'ဇမ္ဗူသီရိ', lat: 19.75, lon: 96.07 },
          { name: 'Zeyathiri', nameMm: 'ဇေယျာသီရိ', lat: 19.92, lon: 96.0 },
          { name: 'Lewe', nameMm: 'လယ်ဝေး', lat: 19.63, lon: 96.12 },
        ]
      },
    }
  },

  // ═══════════════════════════════════════════════
  //  STATES (7)
  // ═══════════════════════════════════════════════

  'Kachin': {
    nameMm: 'ကချင်ပြည်နယ်', type: 'state', lat: 25.38, lon: 97.38,
    districts: {
      'Myitkyina': {
        nameMm: 'မြစ်ကြီးနားခရိုင်', lat: 25.38, lon: 97.38,
        townships: [
          { name: 'Myitkyina', nameMm: 'မြစ်ကြီးနား', lat: 25.38, lon: 97.38 },
          { name: 'Waingmaw', nameMm: 'ဝိုင်းမော်', lat: 25.35, lon: 97.43 },
          { name: 'Injangyang', nameMm: 'အင်ဂျန်းယန်', lat: 25.97, lon: 97.37 },
          { name: 'Tanai', nameMm: 'တနိုင်း', lat: 26.35, lon: 96.73 },
        ]
      },
      'Bhamo': {
        nameMm: 'ဗန်းမော်ခရိုင်', lat: 24.27, lon: 97.23,
        townships: [
          { name: 'Bhamo', nameMm: 'ဗန်းမော်', lat: 24.27, lon: 97.23 },
          { name: 'Shwegu', nameMm: 'ရွှေကူ', lat: 23.98, lon: 96.87 },
          { name: 'Momauk', nameMm: 'မိုးမောက်', lat: 24.38, lon: 97.55 },
        ]
      },
      'Putao': {
        nameMm: 'ပူတာအိုခရိုင်', lat: 27.33, lon: 97.42,
        townships: [
          { name: 'Putao', nameMm: 'ပူတာအို', lat: 27.33, lon: 97.42 },
          { name: 'Sumprabum', nameMm: 'ဆွမ်ပရာဘွမ်', lat: 26.65, lon: 97.6 },
          { name: 'Machanbaw', nameMm: 'မချမ်းဘော', lat: 27.12, lon: 97.55 },
        ]
      },
    }
  },

  'Kayah': {
    nameMm: 'ကယားပြည်နယ်', type: 'state', lat: 19.67, lon: 97.2,
    districts: {
      'Loikaw': {
        nameMm: 'လွိုင်ကော်ခရိုင်', lat: 19.67, lon: 97.2,
        townships: [
          { name: 'Loikaw', nameMm: 'လွိုင်ကော်', lat: 19.67, lon: 97.2 },
          { name: 'Demoso', nameMm: 'ဒီမောဆို', lat: 19.52, lon: 97.12 },
          { name: 'Hpruso', nameMm: 'ဖရူဆို', lat: 19.42, lon: 97.07 },
          { name: 'Shadaw', nameMm: 'ရှားတော', lat: 19.85, lon: 97.25 },
        ]
      },
      'Bawlakhe': {
        nameMm: 'ဘောလခဲခရိုင်', lat: 19.35, lon: 97.05,
        townships: [
          { name: 'Bawlakhe', nameMm: 'ဘောလခဲ', lat: 19.35, lon: 97.05 },
          { name: 'Hpasawng', nameMm: 'ဖားဆောင်း', lat: 19.22, lon: 97.53 },
          { name: 'Mese', nameMm: 'မယ်စဲ့', lat: 19.4, lon: 97.48 },
        ]
      },
    }
  },

  'Kayin': {
    nameMm: 'ကရင်ပြည်နယ်', type: 'state', lat: 16.88, lon: 97.63,
    districts: {
      'Hpa-An': {
        nameMm: 'ဘားအံခရိုင်', lat: 16.88, lon: 97.63,
        townships: [
          { name: 'Hpa-An', nameMm: 'ဘားအံ', lat: 16.88, lon: 97.63 },
          { name: 'Hlaingbwe', nameMm: 'လှိုင်းဘွဲ့', lat: 16.75, lon: 97.83 },
          { name: 'Paingkyon', nameMm: 'ပိုင်ကြုံ', lat: 16.93, lon: 97.82 },
          { name: 'Thandaunggyi', nameMm: 'သံတောင်ကြီး', lat: 18.0, lon: 97.0 },
        ]
      },
      'Kawkareik': {
        nameMm: 'ကော့ကရိတ်ခရိုင်', lat: 16.57, lon: 98.27,
        townships: [
          { name: 'Kawkareik', nameMm: 'ကော့ကရိတ်', lat: 16.57, lon: 98.27 },
          { name: 'Myawaddy', nameMm: 'မြဝတီ', lat: 16.68, lon: 98.52 },
          { name: 'Kyainseikgyi', nameMm: 'ကြာအင်းဆိပ်ကြီး', lat: 15.93, lon: 98.12 },
        ]
      },
    }
  },

  'Chin': {
    nameMm: 'ချင်းပြည်နယ်', type: 'state', lat: 21.3, lon: 93.62,
    districts: {
      'Hakha': {
        nameMm: 'ဟားခါးခရိုင်', lat: 21.97, lon: 93.62,
        townships: [
          { name: 'Hakha', nameMm: 'ဟားခါး', lat: 21.97, lon: 93.62 },
          { name: 'Htantlang', nameMm: 'ထန်တလန်', lat: 21.73, lon: 93.45 },
        ]
      },
      'Falam': {
        nameMm: 'ဖလမ်းခရိုင်', lat: 22.92, lon: 93.67,
        townships: [
          { name: 'Falam', nameMm: 'ဖလမ်း', lat: 22.92, lon: 93.67 },
          { name: 'Tedim', nameMm: 'တီးတိန်', lat: 23.37, lon: 93.55 },
          { name: 'Tonzang', nameMm: 'တွန်းဇံ', lat: 23.55, lon: 93.6 },
        ]
      },
      'Mindat': {
        nameMm: 'မင်းတပ်ခရိုင်', lat: 21.37, lon: 93.92,
        townships: [
          { name: 'Mindat', nameMm: 'မင်းတပ်', lat: 21.37, lon: 93.92 },
          { name: 'Kanpetlet', nameMm: 'ကန်ပက်လက်', lat: 21.18, lon: 94.02 },
          { name: 'Matupi', nameMm: 'မတူပီ', lat: 21.52, lon: 93.43 },
        ]
      },
    }
  },

  'Mon': {
    nameMm: 'မွန်ပြည်နယ်', type: 'state', lat: 16.48, lon: 97.62,
    districts: {
      'Mawlamyine': {
        nameMm: 'မော်လမြိုင်ခရိုင်', lat: 16.48, lon: 97.62,
        townships: [
          { name: 'Mawlamyine', nameMm: 'မော်လမြိုင်', lat: 16.48, lon: 97.62 },
          { name: 'Chaungzon', nameMm: 'ချောင်းဆုံ', lat: 16.35, lon: 97.55 },
          { name: 'Thanbyuzayat', nameMm: 'သံဖြူဇရပ်', lat: 16.0, lon: 97.73 },
          { name: 'Mudon', nameMm: 'မုဒုံ', lat: 16.25, lon: 97.72 },
          { name: 'Ye', nameMm: 'ရေး', lat: 15.25, lon: 97.85 },
        ]
      },
      'Thaton': {
        nameMm: 'သထုံခရိုင်', lat: 16.92, lon: 97.37,
        townships: [
          { name: 'Thaton', nameMm: 'သထုံ', lat: 16.92, lon: 97.37 },
          { name: 'Paung', nameMm: 'ပေါင်', lat: 16.67, lon: 97.45 },
          { name: 'Bilin', nameMm: 'ဘီးလင်း', lat: 17.22, lon: 97.23 },
          { name: 'Kyaikto', nameMm: 'ကျိုက်ထို', lat: 17.32, lon: 97.02 },
        ]
      },
    }
  },

  'Rakhine': {
    nameMm: 'ရခိုင်ပြည်နယ်', type: 'state', lat: 20.15, lon: 92.88,
    districts: {
      'Sittwe': {
        nameMm: 'စစ်တွေခရိုင်', lat: 20.15, lon: 92.88,
        townships: [
          { name: 'Sittwe', nameMm: 'စစ်တွေ', lat: 20.15, lon: 92.88 },
          { name: 'Ponnagyun', nameMm: 'ပုဏ္ဏားကျွန်း', lat: 20.18, lon: 92.97 },
          { name: 'Rathedaung', nameMm: 'ရသေ့တောင်', lat: 20.48, lon: 93.07 },
          { name: 'Buthidaung', nameMm: 'ဘူးသီးတောင်', lat: 20.87, lon: 92.52 },
        ]
      },
      'Kyaukpyu': {
        nameMm: 'ကျောက်ဖြူခရိုင်', lat: 19.43, lon: 93.55,
        townships: [
          { name: 'Kyaukpyu', nameMm: 'ကျောက်ဖြူ', lat: 19.43, lon: 93.55 },
          { name: 'Ramree', nameMm: 'ရမ်းဗြဲ', lat: 19.12, lon: 93.83 },
          { name: 'Ann', nameMm: 'အမ်း', lat: 19.78, lon: 94.02 },
        ]
      },
      'Thandwe': {
        nameMm: 'သံတွဲခရိုင်', lat: 18.47, lon: 94.37,
        townships: [
          { name: 'Thandwe', nameMm: 'သံတွဲ', lat: 18.47, lon: 94.37 },
          { name: 'Toungup', nameMm: 'တောင်ကုတ်', lat: 18.93, lon: 94.22 },
          { name: 'Gwa', nameMm: 'ဂွ', lat: 17.58, lon: 94.55 },
        ]
      },
    }
  },

  'Shan': {
    nameMm: 'ရှမ်းပြည်နယ်', type: 'state', lat: 20.78, lon: 97.03,
    districts: {
      'Taunggyi': {
        nameMm: 'တောင်ကြီးခရိုင်', lat: 20.78, lon: 97.03,
        townships: [
          { name: 'Taunggyi', nameMm: 'တောင်ကြီး', lat: 20.78, lon: 97.03 },
          { name: 'Nyaungshwe', nameMm: 'ညောင်ရွှေ', lat: 20.67, lon: 96.93 },
          { name: 'Kalaw', nameMm: 'ကလော', lat: 20.63, lon: 96.57 },
          { name: 'Pindaya', nameMm: 'ပင်းတယ', lat: 20.95, lon: 96.67 },
          { name: 'Hopong', nameMm: 'ဟိုပုံး', lat: 20.5, lon: 97.18 },
          { name: 'Ywangan', nameMm: 'ရွာငံ', lat: 20.83, lon: 96.5 },
        ]
      },
      'Lashio': {
        nameMm: 'လားရှိုးခရိုင်', lat: 22.93, lon: 97.75,
        townships: [
          { name: 'Lashio', nameMm: 'လားရှိုး', lat: 22.93, lon: 97.75 },
          { name: 'Hsipaw', nameMm: 'သီပေါ', lat: 22.62, lon: 97.3 },
          { name: 'Kyaukme', nameMm: 'ကျောက်မဲ', lat: 22.53, lon: 97.03 },
          { name: 'Nawnghkio', nameMm: 'နောင်ချို', lat: 22.35, lon: 96.77 },
          { name: 'Muse', nameMm: 'မူဆယ်', lat: 23.98, lon: 98.5 },
        ]
      },
      'Kengtung': {
        nameMm: 'ကျိုင်းတုံခရိုင်', lat: 21.28, lon: 99.6,
        townships: [
          { name: 'Kengtung', nameMm: 'ကျိုင်းတုံ', lat: 21.28, lon: 99.6 },
          { name: 'Mongla', nameMm: 'မိုင်းလား', lat: 21.48, lon: 99.78 },
          { name: 'Monghsat', nameMm: 'မိုင်းဆတ်', lat: 20.53, lon: 99.27 },
        ]
      },
      'Tachileik': {
        nameMm: 'တာချီလိတ်ခရိုင်', lat: 20.45, lon: 99.88,
        townships: [
          { name: 'Tachileik', nameMm: 'တာချီလိတ်', lat: 20.45, lon: 99.88 },
          { name: 'Monghpyak', nameMm: 'မိုင်းဖြတ်', lat: 20.18, lon: 99.72 },
        ]
      },
    }
  },
};

/**
 * Helper functions for cascading dropdowns
 */

/** Get all state/region names */
export function getStateRegions() {
  return Object.entries(myanmarAdmin).map(([name, data]) => ({
    name,
    nameMm: data.nameMm,
    type: data.type,
    lat: data.lat,
    lon: data.lon,
  }));
}

/** Get districts for a given state/region */
export function getDistricts(stateRegion) {
  const sr = myanmarAdmin[stateRegion];
  if (!sr) return [];
  return Object.entries(sr.districts).map(([name, data]) => ({
    name,
    nameMm: data.nameMm,
    lat: data.lat,
    lon: data.lon,
  }));
}

/** Get townships for a given state/region and district */
export function getTownships(stateRegion, district) {
  const sr = myanmarAdmin[stateRegion];
  if (!sr || !sr.districts[district]) return [];
  return sr.districts[district].townships;
}

/** Get coordinates for a township */
export function getTownshipCoords(stateRegion, district, township) {
  const townships = getTownships(stateRegion, district);
  const t = townships.find(ts => ts.name === township);
  return t ? { lat: t.lat, lon: t.lon } : null;
}

/** Search all locations (flat) for the search bar */
export function searchAllLocations(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  for (const [srName, srData] of Object.entries(myanmarAdmin)) {
    if (srName.toLowerCase().includes(q) || (srData.nameMm && srData.nameMm.includes(query.trim()))) {
      results.push({ name: srName, nameMm: srData.nameMm, type: srData.type, parent: null, lat: srData.lat, lon: srData.lon });
    }
    for (const [dName, dData] of Object.entries(srData.districts)) {
      if (dName.toLowerCase().includes(q) || (dData.nameMm && dData.nameMm.includes(query.trim()))) {
        results.push({ name: dName, nameMm: dData.nameMm, type: 'district', parent: srName, lat: dData.lat, lon: dData.lon });
      }
      for (const ts of dData.townships) {
        if (ts.name.toLowerCase().includes(q) || (ts.nameMm && ts.nameMm.includes(query.trim()))) {
          results.push({ name: ts.name, nameMm: ts.nameMm, type: 'township', parent: `${dName}, ${srName}`, lat: ts.lat, lon: ts.lon });
        }
      }
    }
  }

  // Sort: exact start matches first
  results.sort((a, b) => {
    const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aStart - bStart;
  });

  return results.slice(0, limit);
}
