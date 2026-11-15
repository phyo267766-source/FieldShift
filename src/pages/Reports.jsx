import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Download, Printer, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { reportApi } from '../api/client';

function formatDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatNumber(value, decimals = 1) {
  return value == null || !Number.isFinite(Number(value))
    ? 'Not available'
    : Number(value).toFixed(decimals);
}

function highestRisk(risks = []) {
  const levels = ['High', 'Moderate', 'Medium', 'Low'];
  return levels.find(level => risks.some(risk => risk.level === level)) || 'Not available';
}

function FarmField({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  );
}

export default function Reports() {
  const routerLocation = useLocation();
  const { t } = useLanguage();
  const { currentFarm, backendAvailable, loading: farmsLoading } = useFarm();

  const [activeTab, setActiveTab] = useState('generate');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const automaticRequest = useRef(null);

  const routeFarmId = routerLocation.state?.reportFarmId;
  const selectedPlanId = (
    currentFarm &&
    String(routeFarmId) === String(currentFarm.id)
  ) ? routerLocation.state?.selectedPlanId : null;

  const generateReport = useCallback(async () => {
    if (farmsLoading) return;
    if (!backendAvailable) {
      setError('The Flask backend is unavailable. Reconnect to the backend and retry report generation.');
      setSuccess(null);
      return;
    }

    const farmId = Number(currentFarm?.id);
    if (!Number.isSafeInteger(farmId) || farmId <= 0) {
      setError(currentFarm
        ? 'This farm is stored only in this browser. Save it to the backend before generating a report.'
        : 'Select a farm saved in the backend before generating a report.');
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const request = { farm_id: farmId };
      if (selectedPlanId != null) request.selected_plan_id = selectedPlanId;
      const response = await reportApi.create(request);
      if (
        response.message !== 'Report generated successfully.' ||
        !response.report?.id ||
        Number(response.report.farm_id) !== farmId ||
        !response.report.data?.farm ||
        !response.report.data?.climate
      ) {
        throw new Error('The backend did not confirm a complete report for the selected farm.');
      }

      setReport(response.report);
      setSuccess(response.message);
    } catch (requestError) {
      setError(requestError.message || 'Could not generate the farm report. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [backendAvailable, currentFarm, farmsLoading, selectedPlanId]);

  useEffect(() => {
    if (farmsLoading) return;
    if (!currentFarm) {
      setReport(null);
      setError('Select a farm to generate a report.');
      return;
    }

    setReport(previous =>
      previous && String(previous.farm_id) === String(currentFarm.id) ? previous : null
    );

    const requestKey = `${routerLocation.key}:${currentFarm.id}:${selectedPlanId || ''}`;
    if (automaticRequest.current === requestKey) return;
    automaticRequest.current = requestKey;
    generateReport();
  }, [currentFarm, farmsLoading, generateReport, routerLocation.key, selectedPlanId]);

  const downloadPdf = async () => {
    if (!report?.id) return;
    setPdfLoading(true);
    setError(null);
    try {
      const blob = await reportApi.downloadPdf(report.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const name = report.data?.farm?.name || 'farm';
      const filename = name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '') || 'farm';
      link.href = objectUrl;
      link.download = `${filename}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message || 'Could not download the report PDF. Please retry.');
    } finally {
      setPdfLoading(false);
    }
  };

  const printReport = () => {
    if (!report?.data) return;
    setActiveTab('print');
    window.print();
  };

  const visibleReport = report && String(report.farm_id) === String(currentFarm?.id)
    ? report
    : null;
  const data = visibleReport?.data;
  const farm = data?.farm || {};
  const climate = data?.climate || {};
  const summary = climate.summary || {};
  const risks = climate.risks || [];
  const rotation = data?.rotation || {};
  const selectedPlan = rotation.selected_plan;
  const latestPlan = rotation.latest_plan;
  const rotationPlans = [
    ...(selectedPlan
      ? [{
          plan: selectedPlan,
          title: 'Selected rotation plan',
          note: 'This plan was explicitly included for this report.',
        }]
      : []),
    ...(latestPlan && String(latestPlan.id) !== String(selectedPlan?.id)
      ? [{
          plan: latestPlan,
          title: 'Latest generated rotation plan',
          note: 'This is saved farm data, not a user-selected comparison plan.',
        }]
      : []),
  ];
  const dateRange = summary.date_range || {};
  const formattedPeriod = dateRange.start && dateRange.end
    ? `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`
    : 'Observation period not available';
  const farmLocation = [farm.region, farm.district, farm.township, farm.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="reports-page max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('turnInsight')}</p>
      <h1 className="page-header mt-1">{t('yourFarmReport')}</h1>
      <p className="page-subtitle">{t('practicalSummary')}</p>

      <div className="reports-actions flex flex-wrap items-center gap-2 mt-6 mb-6">
        <button
          onClick={() => { setActiveTab('generate'); generateReport(); }}
          disabled={loading}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            activeTab === 'generate'
              ? 'bg-forest text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          } disabled:opacity-60`}
        >
          {loading && activeTab === 'generate'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <FileText className="w-4 h-4" />}
          {t('generateReport')}
        </button>
        <button
          onClick={() => { setActiveTab('download'); downloadPdf(); }}
          disabled={!visibleReport || pdfLoading}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            activeTab === 'download'
              ? 'bg-forest text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {pdfLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />}
          {t('downloadPdf')}
        </button>
        <button
          onClick={printReport}
          disabled={!visibleReport}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            activeTab === 'print'
              ? 'bg-forest text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Printer className="w-4 h-4" />
          {t('printReport')}
        </button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={generateReport}
            disabled={loading || farmsLoading}
            className="inline-flex items-center gap-1 font-medium underline disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {success && (
        <p className="mb-4 text-sm text-green-700 dark:text-green-400">{success}</p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-3 text-gray-500" role="status">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Generating report from farm and NASA POWER data...</span>
        </div>
      )}

      {visibleReport ? (
        <div className="card border-t-4 border-t-forest dark:border-t-brand-400 reports-print-content">
          <div className="mb-6">
            <p className="text-xs font-medium text-forest dark:text-brand-400 uppercase tracking-wider">
              FieldShift / Farm Climate Summary
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {farm.name || 'Farm Report'}
            </h2>
            {farmLocation && <p className="text-sm text-gray-500 mt-0.5">{farmLocation}</p>}
            <p className="text-xs text-gray-400 mt-1">
              NASA POWER observation period: {formattedPeriod}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Source: {climate.source || 'Not available'}
              {climate.retrieved_at ? ` • Retrieved ${climate.retrieved_at}` : ''}
              {visibleReport.created_at ? ` • Report saved ${visibleReport.created_at}` : ''}
            </p>
          </div>

          <section className="mb-6 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="section-title mb-3">Saved farm profile</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FarmField
                label="Farm size"
                value={farm.area == null ? null : `${farm.area} ${farm.area_unit || ''}`.trim()}
              />
              <FarmField label="Soil type" value={farm.soil_type} />
              <FarmField label="Current crop" value={farm.current_crop} />
              <FarmField label="Previous crop" value={farm.previous_crop} />
              <FarmField label="Planting season" value={farm.planting_season} />
              <FarmField label="Irrigation method" value={farm.irrigation_method} />
            </dl>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 dark:border-gray-700 mb-6">
            <StatCard
              label="Average temperature"
              value={summary.temperature?.average == null
                ? 'Not available'
                : `${formatNumber(summary.temperature.average)} ${summary.temperature.unit || '°C'}`}
            />
            <StatCard
              label="Total rainfall"
              value={summary.rainfall?.total == null
                ? 'Not available'
                : `${formatNumber(summary.rainfall.total)} ${summary.rainfall.unit || 'mm'}`}
            />
            <StatCard
              label="Soil wetness"
              value={summary.soil_wetness?.average == null
                ? 'Not available'
                : `${formatNumber(summary.soil_wetness.average, 3)} ${summary.soil_wetness.unit || ''}`.trim()}
            />
            <StatCard label="Climate risk" value={highestRisk(risks)} />
          </div>

          {summary.humidity?.average != null && (
            <p className="text-sm text-gray-500 mb-6">
              Average observed humidity: {formatNumber(summary.humidity.average)} {summary.humidity.unit || '%'}
            </p>
          )}

          {Object.values(data.recommendations || {}).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.values(data.recommendations).map((recommendation, index) => (
                <div key={`${recommendation.title}-${index}`} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{recommendation.title}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {recommendation.plan || recommendation.value}
                  </p>
                  {recommendation.note && (
                    <p className="text-sm text-gray-500 mt-1">{recommendation.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {rotationPlans.length > 0 ? (
            <section className="mb-6">
              {rotationPlans.map(({ plan, title, note }) => (
                <div key={`${title}-${plan.id}`} className="mb-5 last:mb-0">
                  <h3 className="section-title mb-2">{title}</h3>
                  <p className="text-xs text-gray-400 mb-2">{note}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {(plan.sequence || []).join(' → ')}
                  </p>
                  {plan.score != null && (
                    <p className="text-sm text-gray-500 mt-1">
                      Suitability score: {formatNumber(plan.score, 0)} / 100 (illustrative)
                    </p>
                  )}
                  {plan.explanation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.explanation}</p>
                  )}
                  {plan.season_details?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {plan.season_details.map((season, index) => (
                        <div key={`${season.season_label || season.season_name || 'season'}-${index}`} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                          <p className="text-xs text-gray-400">
                            {season.season_label || season.season_name || `Season ${index + 1}`}
                            {season.period ? ` • ${season.period}` : ''}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{season.crop}</p>
                          {season.water_demand && (
                            <p className="text-xs text-gray-500 mt-1">Water demand: {season.water_demand}</p>
                          )}
                          {season.soil_health && (
                            <p className="text-xs text-gray-500">Soil health: {season.soil_health}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {plan.benefits?.length > 0 && (
                    <ul className="list-disc pl-5 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {plan.benefits.map((benefit, index) => (
                        <li key={benefit.id || index}>
                          {typeof benefit === 'string'
                            ? benefit
                            : [benefit.title, benefit.desc].filter(Boolean).join(': ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ) : (
            <p className="mb-6 text-sm text-gray-500">
              No saved rotation plan is available, and no plan has been selected.
            </p>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400">
              DATA &amp; LIMITATIONS • Historical climate measurements are attributed to NASA POWER. Crop rotation scores are illustrative rule-based estimates, not guaranteed yield outcomes.
            </p>
          </div>
        </div>
      ) : !loading && (
        <div className="card text-sm text-gray-500">
          No verified report is available yet. Generate a report to load data for the selected farm.
        </div>
      )}
    </div>
  );
}
