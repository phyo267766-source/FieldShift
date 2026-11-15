import { useEffect, useState } from 'react';
import { ArrowRight, Leaf, FileText, Plus, Loader2, AlertCircle, ShieldCheck, Bug, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { rotationApi } from '../api/client';

// Pest/disease data for Myanmar crops
const PEST_DISEASE_INFO = {
  Rice: {
    pests: ['Stem borer', 'Brown planthopper', 'Rice bug'],
    diseases: ['Blast', 'Bacterial leaf blight', 'Sheath blight'],
    rotationHelps: 'Rotating away from rice breaks stem borer and blast disease cycles.',
  },
  Wheat: {
    pests: ['Aphids', 'Armyworm'],
    diseases: ['Rust', 'Powdery mildew'],
    rotationHelps: 'Legume rotations reduce rust spore carryover in soil.',
  },
  Maize: {
    pests: ['Fall armyworm', 'Corn earworm', 'Stem borer'],
    diseases: ['Northern leaf blight', 'Stalk rot'],
    rotationHelps: 'Non-grass rotations disrupt armyworm and stem borer life cycles.',
  },
  'Mung Bean': {
    pests: ['Pod borer', 'Whitefly'],
    diseases: ['Yellow mosaic virus', 'Powdery mildew'],
    rotationHelps: 'Legume nitrogen fixation benefits subsequent cereal crops.',
  },
  Soybean: {
    pests: ['Pod borer', 'Leaf roller'],
    diseases: ['Rust', 'Root rot'],
    rotationHelps: 'Cereal rotation after soybean uses residual nitrogen efficiently.',
  },
  Sesame: {
    pests: ['Sesame webworm', 'Aphids'],
    diseases: ['Phyllody', 'Charcoal rot'],
    rotationHelps: 'Short-cycle crop that breaks disease patterns between cereals.',
  },
  Groundnut: {
    pests: ['Leaf miner', 'Aphids', 'White grub'],
    diseases: ['Leaf spot', 'Rust', 'Collar rot'],
    rotationHelps: 'Fixes nitrogen like other legumes; avoid planting after other legumes.',
  },
  Sunflower: {
    pests: ['Head borer', 'Aphids'],
    diseases: ['Downy mildew', 'Sclerotinia'],
    rotationHelps: 'Deep roots improve soil structure for following crops.',
  },
  Cotton: {
    pests: ['Bollworm', 'Whitefly', 'Jassid'],
    diseases: ['Wilt', 'Root rot'],
    rotationHelps: 'Non-host rotation reduces bollworm pressure significantly.',
  },
  Chickpea: {
    pests: ['Pod borer', 'Cutworm'],
    diseases: ['Wilt', 'Ascochyta blight'],
    rotationHelps: 'Fixes nitrogen; benefits from cereal pre-crop for disease suppression.',
  },
};

const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Mung Bean', 'Soybean', 'Sesame', 'Groundnut', 'Sunflower', 'Cotton', 'Chickpea'];

const CONFIDENCE_LEVELS = {
  high: { label: 'High', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '✓' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '~' },
  low: { label: 'Low', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '?' },
};

function ConfidenceBadge({ level }) {
  const cfg = CONFIDENCE_LEVELS[level] || CONFIDENCE_LEVELS.medium;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded ${cfg.color}`}>
      {cfg.icon} Confidence: {cfg.label}
    </span>
  );
}

function CropCard({ card, showPests = false }) {
  const pestInfo = PEST_DISEASE_INFO[card.crop];
  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.season}</p>
          <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{card.crop}</h4>
        </div>
        {card.confidence && <ConfidenceBadge level={card.confidence} />}
      </div>
      <p className="text-sm text-gray-500 mt-0.5">{card.period}</p>

      <div className="mt-3 mb-3 h-28 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center overflow-hidden">
        <div className="text-4xl">{card.icon || <Leaf className="w-10 h-10 text-brand-500" />}</div>
      </div>

      <div className="space-y-2 mt-auto text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase">Water demand</p>
          <p className="text-gray-700 dark:text-gray-300">{card.rainfall || card.water_demand || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase">Soil benefit</p>
          <p className="text-gray-700 dark:text-gray-300">{card.soilHealth || card.soil_benefit || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase">Climate suitability</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{card.suitability || card.climate_suitability || 'N/A'}</p>
        </div>
      </div>

      {/* Pest/disease section */}
      {showPests && pestInfo && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 mb-2">
            <Bug className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pest & Disease Risks</p>
          </div>
          <div className="space-y-1.5">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Common pests</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{pestInfo.pests.join(', ')}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Common diseases</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{pestInfo.diseases.join(', ')}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Rotation benefit</p>
              <p className="text-xs text-green-600 dark:text-green-400">{pestInfo.rotationHelps}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CropRotation() {
  const { location } = useLocation();
  const { t } = useLanguage();
  const { farms, currentFarm, selectFarm, backendAvailable } = useFarm();

  const [currentCrop, setCurrentCrop] = useState('Rice');
  const [previousCrop, setPreviousCrop] = useState('Rice');
  const [soilType, setSoilType] = useState('Clay loam');
  const [season, setSeason] = useState('Monsoon');
  const [planningPeriod, setPlanningPeriod] = useState('3');
  const [waterAvailability, setWaterAvailability] = useState('Moderate');
  const [irrigationMethod, setIrrigationMethod] = useState('Rain-fed');
  const [showPestInfo, setShowPestInfo] = useState(true);

  const [showPlan, setShowPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const [plan, setPlan] = useState(null);
  const [isBackendPlan, setIsBackendPlan] = useState(false);
  const [missingInfo, setMissingInfo] = useState([]);

  useEffect(() => {
    if (!currentFarm) return;
    if (CROP_OPTIONS.includes(currentFarm.current_crop)) setCurrentCrop(currentFarm.current_crop);
    if (CROP_OPTIONS.includes(currentFarm.previous_crop)) setPreviousCrop(currentFarm.previous_crop);
    if (currentFarm.soil_type) setSoilType(currentFarm.soil_type);
    if (currentFarm.planting_season) setSeason(currentFarm.planting_season);
    if (currentFarm.irrigation_method) setIrrigationMethod(currentFarm.irrigation_method);
  }, [currentFarm]);

  const generatePlan = async () => {
    const farmId = Number(currentFarm?.id);
    if (!backendAvailable) {
      setError('The backend is not connected. Start the Flask server to generate a rotation plan.');
      return;
    }
    if (!Number.isSafeInteger(farmId) || farmId <= 0) {
      setError('Select a farm saved in the backend before generating a rotation plan.');
      return;
    }

    setGenerating(true);
    setError(null);
    setMissingInfo([]);

    // Check for missing info
    const missing = [];
    if (!currentFarm?.latitude || !currentFarm?.longitude) missing.push('Farm GPS coordinates (location-specific climate data unavailable)');
    if (!currentFarm?.soil_type && soilType === 'Clay loam') missing.push('Confirmed soil type (using default: Clay loam)');
    if (!currentFarm?.area) missing.push('Farm area (yield estimates unavailable)');
    setMissingInfo(missing);

    try {
      const response = await rotationApi.generate({
        farm_id: farmId,
        current_crop: currentCrop,
        previous_crop: previousCrop,
        soil_type: soilType,
        water_availability: waterAvailability,
        irrigation_method: irrigationMethod,
        planting_season: season,
        planning_period: Number(planningPeriod),
      });

      const data = response.plan;
      if (
        !data ||
        !Array.isArray(data.sequence) ||
        data.sequence.length === 0 ||
        !Array.isArray(data.season_details) ||
        data.season_details.length !== data.sequence.length
      ) {
        throw new Error('The backend returned an incomplete rotation plan.');
      }

      const cards = data.season_details.map(s => ({
        season: s.season_label || s.season_name,
        crop: s.crop,
        period: s.period || s.season_name,
        icon: s.icon || '🌱',
        rainfall: s.water_demand || 'N/A',
        soilHealth: s.soil_health || 'N/A',
        suitability: s.suitability || (s.suitability_score != null ? `${s.suitability_score} / 100` : 'N/A'),
      }));

      const firstPeriod = cards[0]?.period;
      const lastPeriod = cards[cards.length - 1]?.period;
      const transformedPlan = {
        id: data.id,
        farm_id: data.farm_id,
        title: `${currentCrop} rotation plan`,
        farmName: currentFarm.name,
        seasons: data.planning_period,
        dateRange: firstPeriod && lastPeriod
          ? (firstPeriod === lastPeriod ? firstPeriod : `${firstPeriod} – ${lastPeriod}`)
          : data.planting_season,
        sequence: data.sequence,
        cards,
        benefits: data.benefits || [],
        score: data.score,
        explanation: data.explanation,
      };

      setPlan(transformedPlan);
      setIsBackendPlan(true);
      setShowPlan(true);
    } catch (err) {
      const details = Array.isArray(err.details) ? err.details.join(' ') : err.details;
      setError(details ? `${err.message} ${details}` : err.message || 'Could not generate the rotation plan.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('planForBest')}</p>
      <h1 className="page-header mt-1">{t('smartCropRotation')}</h1>
      <p className="page-subtitle">{t('planHealthier')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <h2 className="section-title mb-4">{t('yourGrowingConditions')}</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Select farm</label>
              <select
                className="select-field"
                value={currentFarm?.id || ''}
                onChange={(e) => {
                  const farm = farms.find(f => String(f.id) === e.target.value);
                  if (farm) selectFarm(farm);
                }}
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id}>{f.name || 'Unnamed Farm'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Current crop</label>
              <select className="select-field" value={currentCrop} onChange={e => setCurrentCrop(e.target.value)}>
                {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Previous crop</label>
              <select className="select-field" value={previousCrop} onChange={e => setPreviousCrop(e.target.value)}>
                {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Soil type</label>
              <select className="select-field" value={soilType} onChange={e => setSoilType(e.target.value)}>
                {['Clay loam', 'Sandy loam', 'Silt loam', 'Clay', 'Sandy', 'Loam', 'Alluvial', 'Laterite'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Water availability</label>
              <select className="select-field" value={waterAvailability} onChange={e => setWaterAvailability(e.target.value)}>
                <option>Low</option><option>Moderate</option><option>High</option>
              </select>
            </div>
            <div>
              <label className="label">Planting season</label>
              <select className="select-field" value={season} onChange={e => setSeason(e.target.value)}>
                <option value="Monsoon">Monsoon • May–Oct</option>
                <option value="Winter">Winter • Nov–Feb</option>
                <option value="Summer">Summer • Mar–May</option>
              </select>
            </div>
            <div>
              <label className="label">Planning period</label>
              <select className="select-field" value={planningPeriod} onChange={e => setPlanningPeriod(e.target.value)}>
                <option value="2">2 seasons</option>
                <option value="3">3 seasons</option>
                <option value="4">4 seasons</option>
              </select>
            </div>

            {/* Toggle pest info */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPestInfo}
                onChange={() => setShowPestInfo(!showPestInfo)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Show pest & disease info</span>
            </label>
          </div>

          <button
            onClick={generatePlan}
            disabled={generating}
            className="btn-primary w-full mt-6 justify-center"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <>Generate Rotation Plan <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            {backendAvailable
              ? 'Scored using rule-based engine. Scores are illustrative.'
              : 'Backend not connected. Connect to generate a rotation plan.'}
          </p>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3 h-3 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Right: Rotation plan */}
        <div className="lg:col-span-3">
          {showPlan && (
            <>
              {/* Missing info disclosure */}
              {missingInfo.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Some information is missing — recommendations may be less precise:
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {missingInfo.map((info, i) => (
                          <li key={i} className="text-xs text-blue-600 dark:text-blue-400">• {info}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-forest uppercase tracking-wider">
                    {isBackendPlan ? '✦ Generated plan' : '✦ Example plan – Ready to explore'}
                  </p>
                  {plan.overallConfidence && (
                    <ConfidenceBadge level={plan.overallConfidence} />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{plan.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {plan.farmName} • {plan.seasons} seasons • {plan.dateRange}
                </p>

                {isBackendPlan && plan.score != null && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded text-xs font-medium text-green-700 dark:text-green-400">
                    <ShieldCheck className="w-3 h-3" />
                    Score: {typeof plan.score === 'number' ? plan.score.toFixed(1) : plan.score}/100 (illustrative)
                  </div>
                )}

                {/* Sequence flow */}
                <div className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex-wrap">
                  {plan.sequence.map((crop, i) => (
                    <span key={i} className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-forest text-white text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        {crop}
                      </span>
                      {i < plan.sequence.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Crop cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {plan.cards.map((card, i) => (
                  <CropCard key={i} card={card} showPests={showPestInfo} />
                ))}
              </div>

              {/* Explanation */}
              {isBackendPlan && plan.explanation && (
                <div className="card mb-6">
                  <h3 className="section-title mb-2">Plan Rationale</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.explanation}</p>
                </div>
              )}

              {/* Benefits */}
              <div className="card mb-6">
                <h3 className="section-title mb-1">Why This Rotation</h3>
                <p className="text-sm text-gray-500 mb-4">Different crops, complementary benefits.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(plan.benefits) ? plan.benefits : []).map((b, i) => (
                    <div key={b.id || i} className="flex gap-3">
                      <span className="text-xs font-bold text-forest mt-0.5">{b.id || `0${i+1}`}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{b.desc || b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data limitations notice */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p><strong>Data transparency:</strong> Rotation recommendations are generated by a rule-based engine using your farm inputs.</p>
                    <p>Suitability scores are illustrative estimates, not guaranteed yield outcomes.</p>
                    <p>Pest and disease information is general for Myanmar conditions. Consult local agricultural extension services for region-specific advice.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/compare-plans"
                  state={{
                    rotationInputs: {
                      farm_id: currentFarm?.id,
                      current_crop: currentCrop,
                      previous_crop: previousCrop,
                      soil_type: soilType,
                      water_availability: waterAvailability,
                      irrigation_method: irrigationMethod,
                      planting_season: season,
                      planning_period: Number(planningPeriod),
                    },
                  }}
                  className="btn-primary"
                >
                  Compare rotation plans <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/reports"
                  state={{
                    reportFarmId: currentFarm?.id,
                    selectedPlanId: isBackendPlan ? plan?.id : null,
                  }}
                  className="btn-outline"
                >
                  <FileText className="w-4 h-4" /> View plan report
                </Link>
                <button onClick={() => { setPlan(null); setShowPlan(false); setIsBackendPlan(false); setMissingInfo([]); }} className="btn-outline">
                  <Plus className="w-4 h-4" /> Start new plan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
