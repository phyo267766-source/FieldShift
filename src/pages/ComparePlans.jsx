import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { rotationApi } from '../api/client';

function PlanCard({ plan, isSelected, isSaving, onSelect, onViewDetails }) {
  const isRecommended = plan.recommended;

  return (
    <div
      className={`card transition-all ${
        isSelected
          ? 'border-2 border-forest ring-1 ring-forest/10 bg-olive-light/30 dark:border-brand-500 dark:bg-brand-900/20'
          : 'hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`text-xs font-medium uppercase tracking-wider ${
          isRecommended ? 'text-forest dark:text-brand-400' : 'text-gray-400'
        }`}>
          {isRecommended ? '✦ Recommended' : plan.label}
        </p>
        {isSelected && (
          <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-brand-600">
            Selected Plan
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
      <p className="text-sm text-gray-500 mt-0.5">
        {plan.sequence.join(' → ')}
      </p>

      <div className="mt-4 mb-4">
        <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {typeof plan.score === 'number' ? plan.score.toFixed(0) : plan.score ?? '—'}
          <span className="text-lg font-normal text-gray-400"> / 100</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Overall suitability score (illustrative)</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Climate score</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">
            {plan.climateScore != null ? `${plan.climateScore}/100` : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Water demand</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{plan.waterDemand ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Soil health benefits</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{plan.soilHealth ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Crop diversity</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{plan.cropDiversity ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sustainability risk</span>
          <span className="font-medium text-gray-900 dark:text-gray-200">{plan.sustainabilityRisk ?? '—'}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className={`w-full justify-center ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
            onClick={onSelect}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isSelected ? 'Selected Plan' : 'Select This Plan'}
          </button>
          <button className="btn-ghost w-full justify-center" onClick={onViewDetails}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComparePlans() {
  const routerLocation = useRouterLocation();
  const rotationInputs = routerLocation.state?.rotationInputs || {};
  const { t } = useLanguage();
  const { farms, currentFarm, backendAvailable, loading: farmsLoading } = useFarm();

  const [farmId, setFarmId] = useState(() => String(rotationInputs.farm_id ?? currentFarm?.id ?? ''));
  const [currentCrop, setCurrentCrop] = useState(rotationInputs.current_crop || currentFarm?.current_crop || 'Rice');
  const [previousCrop, setPreviousCrop] = useState(rotationInputs.previous_crop || currentFarm?.previous_crop || 'Rice');
  const [soilType, setSoilType] = useState(rotationInputs.soil_type || currentFarm?.soil_type || 'Clay loam');
  const [waterAvailability, setWaterAvailability] = useState(rotationInputs.water_availability || 'Moderate');
  const [irrigationMethod, setIrrigationMethod] = useState(rotationInputs.irrigation_method || currentFarm?.irrigation_method || 'Rain-fed');
  const [plantingSeason, setPlantingSeason] = useState(rotationInputs.planting_season || currentFarm?.planting_season || 'Monsoon');
  const [planningPeriod, setPlanningPeriod] = useState(String(rotationInputs.planning_period || 3));
  const [selected, setSelected] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingSelectionKey, setSavingSelectionKey] = useState(null);

  const comparisonRequest = {
    farm_id: Number(farmId),
    current_crop: currentCrop,
    previous_crop: previousCrop,
    soil_type: soilType,
    water_availability: waterAvailability,
    irrigation_method: irrigationMethod,
    planting_season: plantingSeason,
    planning_period: Number(planningPeriod),
  };
  const comparisonContextRef = useRef(JSON.stringify(comparisonRequest));
  comparisonContextRef.current = JSON.stringify(comparisonRequest);

  useEffect(() => {
    if (!rotationInputs.farm_id && currentFarm) {
      setFarmId(String(currentFarm.id));
      setCurrentCrop(currentFarm.current_crop || 'Rice');
      setPreviousCrop(currentFarm.previous_crop || 'Rice');
      setSoilType(currentFarm.soil_type || 'Clay loam');
      setIrrigationMethod(currentFarm.irrigation_method || 'Rain-fed');
      setPlantingSeason(currentFarm.planting_season || 'Monsoon');
    }
  }, [currentFarm, routerLocation.key]);

  useEffect(() => {
    let active = true;

    const fetchComparison = async () => {
      if (farmsLoading) return;

      setSelected(null);
      setDetailsId(null);
      setPlans([]);
      setSavingSelectionKey(null);

      if (!backendAvailable) {
        setLoading(false);
        setError('The backend is not connected. Start the Flask server to compare rotation plans.');
        return;
      }

      const numericFarmId = Number(farmId);
      if (!Number.isSafeInteger(numericFarmId) || numericFarmId <= 0) {
        setLoading(false);
        setError(farmId
          ? 'Select a farm saved in the backend before comparing plans.'
          : 'Select a farm to compare rotation plans.');
        return;
      }

      setLoading(true);
      setError(null);
      const request = {
        farm_id: numericFarmId,
        current_crop: currentCrop,
        previous_crop: previousCrop,
        soil_type: soilType,
        water_availability: waterAvailability,
        irrigation_method: irrigationMethod,
        planting_season: plantingSeason,
        planning_period: Number(planningPeriod),
      };
      try {
        const response = await rotationApi.compare(request);

        if (
          !Array.isArray(response.plans) ||
          response.plans.length !== 3 ||
          response.plans.some(plan => !Array.isArray(plan.sequence))
        ) {
          throw new Error('The backend did not return three comparison plans.');
        }

        const transformed = response.plans.map((plan, index) => ({
          id: plan.id ?? `plan-${index + 1}`,
          selectionKey: plan.selection_key,
          conditionsKey: plan.conditions_key,
          label: plan.label || `Plan ${index + 1}`,
          name: plan.name || `Plan ${index + 1}`,
          sequence: Array.isArray(plan.sequence) ? plan.sequence : [],
          score: plan.score,
          recommended: plan.recommended === true,
          climateScore: plan.climate_score,
          waterDemand: plan.water_demand,
          soilHealth: plan.soil_health,
          cropDiversity: plan.crop_diversity,
          sustainabilityRisk: plan.sustainability_risk,
          explanation: plan.explanation || '',
          seasonDetails: Array.isArray(plan.season_details) ? plan.season_details : [],
        }));
        if (transformed.filter(plan => plan.recommended).length !== 1) {
          throw new Error('The backend did not identify one recommended comparison plan.');
        }

        if (active) {
          setPlans(transformed);
          const selectionResponse = await rotationApi.getSelection(request);
          const savedSelection = selectionResponse.selection;
          const selectedPlan = savedSelection
            ? transformed.find(plan =>
                plan.selectionKey === savedSelection.selection_key &&
                JSON.stringify(plan.sequence) === JSON.stringify(savedSelection.sequence)
              )
            : null;
          if (active) setSelected(selectedPlan?.selectionKey || null);
        }
      } catch (err) {
        const details = Array.isArray(err.details) ? err.details.join(' ') : err.details;
        if (active) setError(details ? `${err.message} ${details}` : err.message || 'Could not generate comparison plans.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchComparison();
    return () => {
      active = false;
    };
  }, [
    backendAvailable,
    currentCrop,
    farmId,
    farmsLoading,
    irrigationMethod,
    planningPeriod,
    plantingSeason,
    previousCrop,
    soilType,
    waterAvailability,
  ]);

  const bestPlan = plans.find(plan => plan.recommended);
  const detailsPlan = plans.find(plan => plan.id === detailsId);

  useEffect(() => {
    if (!detailsPlan) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setDetailsId(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [detailsPlan]);

  const selectPlan = async (plan) => {
    const request = { ...comparisonRequest };
    const requestContext = JSON.stringify(request);
    setSavingSelectionKey(plan.selectionKey);
    setError(null);
    try {
      const response = await rotationApi.saveSelection({
        ...request,
        sequence: plan.sequence,
        selection_key: plan.selectionKey,
      });
      if (
        response.success !== true ||
        response.selection?.selection_key !== plan.selectionKey ||
        JSON.stringify(response.selection.sequence) !== JSON.stringify(plan.sequence)
      ) {
        throw new Error('The backend did not confirm the selected plan.');
      }
      if (comparisonContextRef.current === requestContext) {
        setSelected(response.selection.selection_key);
      }
    } catch (selectionError) {
      const details = Array.isArray(selectionError.details)
        ? selectionError.details.join(' ')
        : selectionError.details;
      setError(details
        ? `${selectionError.message} ${details}`
        : selectionError.message || 'Could not save the selected plan.');
    } finally {
      if (comparisonContextRef.current === requestContext) {
        setSavingSelectionKey(null);
      }
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('threePaths')}</p>
      <h1 className="page-header mt-1">{t('compareNextCycle')}</h1>
      <p className="page-subtitle">{t('exploreTradeoffs')}</p>

      <div className="flex flex-wrap items-center gap-3 mt-6 mb-8">
        <select
          className="select-field w-auto min-w-[160px]"
          value={farmId}
          onChange={event => setFarmId(event.target.value)}
        >
          <option value="">Select farm</option>
          {farms.map(farm => (
            <option key={farm.id} value={farm.id}>{farm.name || 'Unnamed Farm'}</option>
          ))}
        </select>
        <select
          className="select-field w-auto min-w-[160px]"
          value={planningPeriod}
          onChange={event => setPlanningPeriod(event.target.value)}
        >
          <option value="3">3-season comparison</option>
          <option value="2">2-season comparison</option>
          <option value="4">4-season comparison</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Generating comparison plans...</span>
        </div>
      )}

      {plans.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selected === plan.selectionKey}
                isSaving={savingSelectionKey != null}
                onSelect={() => selectPlan(plan)}
                onViewDetails={() => setDetailsId(plan.id)}
              />
            ))}
          </div>

          {bestPlan && (
            <div className="card mb-6">
              <h3 className="section-title mb-2">
                Why {bestPlan.name} stands out
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {bestPlan.explanation || 'No explanation was provided for this plan.'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Scores are illustrative. Based on rule-based scoring of crop diversity, soil health, water efficiency, and climate suitability.
              </p>
            </div>
          )}

        </>
      )}

      {!loading && plans.length === 0 && !error && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Waiting for farm data...</span>
        </div>
      )}

      <Link to="/crop-rotation" className="btn-ghost">
        <ArrowLeft className="w-4 h-4" /> Return to rotation planner
      </Link>

      {detailsPlan && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailsId(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-details-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:p-6"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${
                  detailsPlan.recommended ? 'text-forest dark:text-brand-400' : 'text-gray-400'
                }`}>
                  {detailsPlan.recommended ? '✦ Recommended' : detailsPlan.label}
                </p>
                <h2 id="plan-details-title" className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                  {detailsPlan.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {detailsPlan.sequence.join(' → ')}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close plan details"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setDetailsId(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Planning period: {detailsPlan.seasonDetails.length || detailsPlan.sequence.length} seasons
            </p>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                ['Overall suitability', detailsPlan.score != null ? `${detailsPlan.score} / 100` : null],
                ['Climate suitability', detailsPlan.climateScore != null ? `${detailsPlan.climateScore} / 100` : null],
                ['Water demand', detailsPlan.waterDemand],
                ['Soil health benefits', detailsPlan.soilHealth],
                ['Crop diversity', detailsPlan.cropDiversity],
                ['Sustainability risk', detailsPlan.sustainabilityRisk],
                ['Recommended', detailsPlan.recommended ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {value ?? 'Not provided by the backend'}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Season details</h3>
              {detailsPlan.seasonDetails.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {detailsPlan.seasonDetails.map((season, index) => (
                    <div key={`${season.season_number ?? index}-${season.crop ?? ''}`} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {season.season_label || `Season ${index + 1}`}: {season.crop || 'Crop not provided'}
                      </p>
                      <p className="mt-1 text-gray-600 dark:text-gray-300">
                        {season.period || season.season_name || 'Season timing not provided'}
                      </p>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Water: {season.water_demand || 'Not provided'} · Soil: {season.soil_health || 'Not provided'} · Suitability: {season.suitability || 'Not provided'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Season details were not provided by the backend.
                </p>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Plan explanation</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {detailsPlan.explanation || 'No explanation was provided by the backend.'}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
