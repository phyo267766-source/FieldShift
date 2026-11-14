// Mock data for FieldShift – all values are realistic demo data

export const farmProfile = {
  name: 'Shwe Pyi Farm',
  country: 'Myanmar / Ayeyarwady',
  location: { lat: 16.77, lon: 94.73 },
  area: 12.5,
  areaUnit: 'hectares',
  soilType: 'Clay loam',
  currentCrop: 'Rice',
  previousCrop: 'Rice',
  irrigationMethod: 'Canal irrigation',
  plantingSeason: 'Monsoon • May–Oct',
  lastUpdated: '14 November 2026',
};

export const dashboardStats = {
  avgTemperature: 28.6,
  totalRainfall: 842,
  soilMoisture: 34,
  currentCrop: 'Rice',
  cropSeason: 'Monsoon season',
  climateRisk: 'Moderate',
  climateRiskNote: 'Monitor heat stress',
  tempChange: '+1.2°C vs same period',
  rainfallChange: '8% vs prior period',
  soilMoistureNote: 'Within typical range',
};

export const monthlyRainfall = [
  { month: 'May', value: 180 },
  { month: 'Jun', value: 210 },
  { month: 'Jul', value: 195 },
  { month: 'Aug', value: 130 },
  { month: 'Sep', value: 85 },
  { month: 'Oct', value: 42 },
];

export const monthlyTemperature = [
  { month: 'May', value: 30.2 },
  { month: 'Jun', value: 29.1 },
  { month: 'Jul', value: 28.4 },
  { month: 'Aug', value: 28.1 },
  { month: 'Sep', value: 28.8 },
  { month: 'Oct', value: 29.5 },
];

export const monthlySoilMoisture = [
  { month: 'May', value: 38 },
  { month: 'Jun', value: 42 },
  { month: 'Jul', value: 40 },
  { month: 'Aug', value: 35 },
  { month: 'Sep', value: 30 },
  { month: 'Oct', value: 28 },
];

export const monthlySolar = [
  { month: 'May', value: 5.1 },
  { month: 'Jun', value: 4.5 },
  { month: 'Jul', value: 4.2 },
  { month: 'Aug', value: 4.6 },
  { month: 'Sep', value: 5.0 },
  { month: 'Oct', value: 5.3 },
];

export const seasonalPatterns = [
  {
    season: 'Wet season / May–Oct',
    description: 'Add lime rainfall in this damp period. Check drainage before heavy rain.',
  },
  {
    season: 'Cool dry / Nov–Feb',
    description: 'Lowest evaporation demand favours a short-duration legume rotation.',
  },
  {
    season: 'Hot dry / Mar–Apr',
    description: 'Higher heat and water stress. Plan to irrigate accordingly early.',
  },
];

export const climateRisks = [
  { risk: 'Drought risk', level: 'Low', color: 'green' },
  { risk: 'Heavy rainfall risk', level: 'Moderate', color: 'amber' },
  { risk: 'Heat stress', level: 'High', color: 'red' },
  { risk: 'Water availability', level: 'Moderate', color: 'amber' },
  { risk: 'Seasonal planting risk', level: 'Low', color: 'green' },
];

export const rotationPlan = {
  title: 'A legume break. A more resilient cycle.',
  farmName: 'Shwe Pyi Farm',
  seasons: 3,
  dateRange: 'May 2027 – Oct 2029',
  sequence: ['Rice', 'Mung Bean', 'Rice'],
  cards: [
    {
      crop: 'Rice',
      season: 'SEASON 01',
      period: 'May – Oct 2027',
      rainfall: 'High > 1,200 mm',
      soilHealth: 'Maintains organic matter',
      suitability: '82 / 100 • Suitable',
      icon: '🌾',
    },
    {
      crop: 'Mung Bean',
      season: 'SEASON 02',
      period: 'Nov 2027 – Feb 2028',
      rainfall: 'Low < 350 mm',
      soilHealth: 'Support nitrogen management',
      suitability: '91 / 100 • Very suitable',
      icon: '🌱',
    },
    {
      crop: 'Rice',
      season: 'SEASON 03',
      period: 'May – Oct 2028',
      rainfall: 'High > 1,200 mm',
      soilHealth: 'Benefits from a legume break',
      suitability: '84 / 100 • Suitable',
      icon: '🌾',
    },
  ],
  benefits: [
    { id: '01', title: 'Crop diversity', desc: 'Break repeated rice cycles and support a more natural growing system.' },
    { id: '02', title: 'Nitrogen management', desc: 'Mung bean can support nitrogen cycling when residues are managed well.' },
    { id: '03', title: 'Soil protection', desc: 'Keep soil covered between rice seasons to help limit soil erosion.' },
    { id: '04', title: 'Water conservation', desc: 'A lower water-demand crop may reduce irrigation pressure.' },
  ],
};

export const comparePlans = [
  {
    id: 'A',
    label: 'PLAN A',
    name: 'Traditional Rotation',
    sequence: ['Rice', 'Rice', 'Rice'],
    score: 62,
    climateScore: 55,
    waterDemand: 'High > 3,800 mm',
    soilHealth: 'Limited',
    cropDiversity: '1 crop',
    sustainabilityRisk: 'Moderate',
    recommended: false,
  },
  {
    id: 'B',
    label: 'RECOMMENDED EXAMPLE',
    name: 'Diversified Rotation',
    sequence: ['Rice', 'Mung Bean', 'Rice'],
    score: 89,
    climateScore: 91,
    waterDemand: 'Lower < 2,750 mm',
    soilHealth: 'Strong',
    cropDiversity: '2 crops',
    sustainabilityRisk: 'Low',
    recommended: true,
  },
  {
    id: 'C',
    label: 'PLAN C',
    name: 'Alternative Rotation',
    sequence: ['Rice', 'Corn', 'Mung Bean'],
    score: 78,
    climateScore: 79,
    waterDemand: 'Medium < 2,150 mm',
    soilHealth: 'Good',
    cropDiversity: '3 crops',
    sustainabilityRisk: 'Moderate',
    recommended: false,
  },
];

export const reportData = {
  title: 'Shwe Pyi Farm',
  location: 'Ayeyarwady, Myanmar • 12.5 ha • Clay loam',
  period: 'May – Oct 2026 / Prepared 14 November 2026 / Demo report',
  stats: {
    avgTemp: '28.6°C',
    totalRainfall: '842 mm',
    soilMoisture: '34 %',
    climateRisk: 'Moderate',
  },
  recommendations: {
    cropRotation: {
      title: 'Crop Rotation Recommendations',
      plan: 'Rice → Mung Bean → Rice',
      note: 'Add a legume break to support nitrogen management and crop diversity.',
    },
    waterConservation: {
      title: 'Water Conservation Assessment',
      value: '24% lower demand, in this example',
      note: 'Plan B: 2,750 mm vs Plan A: 3,800 mm over three seasons.',
    },
    soilManagement: {
      title: 'Soil Management Insights',
      value: 'Protect soil between seasons',
      note: 'Retain appropriate residues and monitor drainage and soil moisture.',
    },
    climateRisk: {
      title: 'Climate Risk Summary',
      value: 'Heat stress needs attention',
      note: 'Monitor crop stress and avoid midday field work during hot periods.',
    },
  },
  planComparison: [
    { name: 'A • Traditional', score: 62 },
    { name: 'B • Diversified', score: 89 },
    { name: 'C • Alternative', score: 78 },
  ],
};

export const dataSourceLabels = {
  power: 'NASA POWER v2.5.0 • Daily monthly values, 2026',
  firms: 'NASA FIRMS • Fire detection, last 7 days',
  gibs: 'NASA GIBS • Satellite imagery',
  derived: 'Locally estimated via formula',
  user: 'User-entered data',
};
