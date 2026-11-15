import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Droplets, Thermometer, Sun, TrendingUp, Loader2, RefreshCw, Cloud, Wind, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import StatCard from '../components/StatCard';
import DataSourceTag from '../components/DataSourceTag';
import InteractiveMap from '../components/InteractiveMap';
import { useLocation } from '../contexts/LocationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { climateApi, weatherApi } from '../api/client';
import {
  dashboardStats, monthlyRainfall, monthlyTemperature,
  monthlySoilMoisture, monthlySolar, dataSourceLabels,
} from '../data/mockData';

function MiniBarChart({ data, color = '#2d5a2d', unit = '' }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(v) => [`${v}${unit}`, '']}
        />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniLineChart({ data, color = '#2d5a2d', unit = '' }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(v) => [`${v}${unit}`, '']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Weather icon map
function weatherIcon(symbol) {
  // Meteomatics weather_symbol_1h:idx — simplified mapping
  if (!symbol) return '🌤️';
  const s = Number(symbol);
  if (s <= 2) return '☀️';
  if (s <= 4) return '⛅';
  if (s <= 6) return '☁️';
  if (s <= 9) return '🌧️';
  if (s <= 12) return '⛈️';
  if (s <= 15) return '🌦️';
  return '🌤️';
}

export default function Dashboard() {
  const { location } = useLocation();
  const { t } = useLanguage();
  const { farms, currentFarm, selectFarm, backendAvailable } = useFarm();

  // Climate data state
  const [climateData, setClimateData] = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateSource, setClimateSource] = useState(dataSourceLabels.power);
  const [demoMode, setDemoMode] = useState(true);

  // Current weather state (Meteomatics)
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherConfigured, setWeatherConfigured] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);

  // Chart data
  const [rainfallData, setRainfallData] = useState(monthlyRainfall);
  const [tempData, setTempData] = useState(monthlyTemperature);
  const [moistureData, setMoistureData] = useState(monthlySoilMoisture);
  const [solarData, setSolarData] = useState(monthlySolar);
  const [stats, setStats] = useState(dashboardStats);

  const refreshTimerRef = useRef(null);

  // Check Meteomatics status once
  useEffect(() => {
    weatherApi.status()
      .then(res => setWeatherConfigured(res.configured))
      .catch(() => setWeatherConfigured(false));
  }, []);

  // Fetch climate data when farm changes
  useEffect(() => {
    if (currentFarm?.id && backendAvailable && !String(currentFarm.id).startsWith('local_')) {
      fetchClimateData(currentFarm.id);
    }
  }, [currentFarm, backendAvailable]);

  // Fetch weather when farm changes or on interval
  useEffect(() => {
    const lat = currentFarm?.latitude || location.lat;
    const lon = currentFarm?.longitude || location.lon;
    if (lat && lon && weatherConfigured) {
      fetchWeather(lat, lon);
    }
    // Auto-refresh every 30 minutes
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (weatherConfigured) {
      refreshTimerRef.current = setInterval(() => {
        const lt = currentFarm?.latitude || location.lat;
        const ln = currentFarm?.longitude || location.lon;
        if (lt && ln) fetchWeather(lt, ln);
      }, 30 * 60 * 1000);
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [currentFarm, weatherConfigured]);

  const fetchWeather = useCallback(async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await weatherApi.getCurrent(lat, lon);
      setWeather(data);
      setLastWeatherUpdate(new Date());
    } catch (err) {
      setWeatherError(err.message);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleManualRefresh = () => {
    const lat = currentFarm?.latitude || location.lat;
    const lon = currentFarm?.longitude || location.lon;
    if (lat && lon) fetchWeather(lat, lon);
  };

  async function fetchClimateData(farmId) {
    setClimateLoading(true);
    try {
      const data = await climateApi.getSummary(farmId);
      setClimateData(data);
      setClimateSource(data.source || dataSourceLabels.power);
      setDemoMode(data.demo_mode || false);

      const summary = data.summary || {};
      if (summary.temperature || summary.rainfall) {
        setStats({
          avgTemperature: summary.temperature?.average ?? dashboardStats.avgTemperature,
          totalRainfall: summary.rainfall?.total ?? dashboardStats.totalRainfall,
          soilMoisture: summary.humidity?.average ?? dashboardStats.soilMoisture,
          currentCrop: currentFarm?.current_crop || dashboardStats.currentCrop,
          cropSeason: currentFarm?.planting_season || dashboardStats.cropSeason,
          climateRisk: _riskLevel(data.risks),
          climateRiskNote: _riskNote(data.risks),
          tempChange: '', rainfallChange: '', soilMoistureNote: '',
        });
      }

      const patterns = data.seasonal_patterns || [];
      if (patterns.length > 0) {
        setRainfallData(patterns.map(p => ({ month: p.month, value: p.total_rainfall ?? 0 })));
        setTempData(patterns.map(p => ({ month: p.month, value: p.avg_temperature ?? 0 })));
        setSolarData(patterns.map(p => ({ month: p.month, value: p.avg_solar ?? 0 })));
        setMoistureData(patterns.map(p => ({
          month: p.month,
          value: p.total_rainfall ? Math.min(50, Math.round(p.total_rainfall / 8)) : 0,
        })));
      }
    } catch (err) {
      console.warn('Climate fetch failed, using mock data:', err.message);
    } finally {
      setClimateLoading(false);
    }
  }

  function _riskLevel(risks) {
    if (!risks || risks.length === 0) return dashboardStats.climateRisk;
    if (risks.find(r => r.level === 'High')) return 'High';
    if (risks.find(r => r.level === 'Moderate')) return 'Moderate';
    return 'Low';
  }
  function _riskNote(risks) {
    if (!risks || risks.length === 0) return dashboardStats.climateRiskNote;
    const high = risks.find(r => r.level === 'High');
    if (high) return high.risk;
    const mod = risks.find(r => r.level === 'Moderate');
    if (mod) return mod.risk;
    return 'No major risks detected';
  }

  const farmName = currentFarm?.name || location.name;
  const farmRegion = currentFarm?.region || location.region || 'Ayeyarwady';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Page header */}
      <div className="mb-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('yourFarmInFocus')}</p>
        <h1 className="page-header mt-1">{t('growSmarter')}</h1>
        <p className="page-subtitle">{t('transformSatellite')}</p>
      </div>

      {/* Farm selector */}
      <div className="flex flex-wrap items-center gap-3 mt-5 mb-6">
        <select
          className="select-field w-auto min-w-[160px]"
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
        <Link to="/my-farm" className="btn-primary">
          {t('analyzeMyFarm')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status banner */}
      <div className="bg-olive-light dark:bg-brand-900/30 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm font-semibold text-forest dark:text-brand-300">
          {demoMode && !weather ? 'Offline Mode • ' : ''}Myanmar / {farmRegion}
          {backendAvailable && !demoMode && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">● Backend connected</span>
          )}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {demoMode && !weather ? t('illustrativeClimate') : `Climate: ${climateSource}`}
          {weather && ' • Weather: Meteomatics (live)'}
        </p>
      </div>

      {/* Loading */}
      {climateLoading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Fetching climate data...
        </div>
      )}

      {/* Current Weather Card (Meteomatics) */}
      {(weather || weatherConfigured) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Weather</h2>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
                Meteomatics
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastWeatherUpdate && (
                <span className="text-[10px] text-gray-400">
                  Updated {lastWeatherUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={weatherLoading}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {weatherError && !weather && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{weatherError}</p>
          )}

          {weather ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl mb-1">{weatherIcon(weather.weather_symbol)}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {weather.temperature_c != null ? `${weather.temperature_c.toFixed(1)}°C` : '—'}
                </p>
                <p className="text-xs text-gray-400">Temperature</p>
              </div>
              <div className="text-center">
                <Droplets className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {weather.humidity_pct != null ? `${weather.humidity_pct.toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-gray-400">Humidity</p>
              </div>
              <div className="text-center">
                <Droplets className="w-6 h-6 mx-auto mb-1 text-cyan-500" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {weather.precipitation_mm != null ? `${weather.precipitation_mm.toFixed(1)} mm` : '—'}
                </p>
                <p className="text-xs text-gray-400">Precipitation (1h)</p>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {weather.wind_speed_ms != null ? `${weather.wind_speed_ms.toFixed(1)} m/s` : '—'}
                </p>
                <p className="text-xs text-gray-400">Wind Speed</p>
              </div>
            </div>
          ) : weatherLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading weather...
            </div>
          ) : !weatherConfigured ? (
            <p className="text-sm text-gray-400">
              Meteomatics API not configured. Add credentials to .env to enable live weather.
            </p>
          ) : null}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
        <StatCard label={t('avgTemperature')} value={`${stats.avgTemperature} °C`} note={stats.tempChange} />
        <StatCard label={t('totalRainfall')} value={`${stats.totalRainfall} mm`} note={stats.rainfallChange} />
        <StatCard label={t('soilMoisture')} value={`${stats.soilMoisture} %`} note={stats.soilMoistureNote} />
        <StatCard label={t('currentCrop')} value={stats.currentCrop} note={stats.cropSeason} />
        <StatCard label={t('climateRisk')} value={stats.climateRisk} note={stats.climateRiskNote} className="col-span-2 md:col-span-1" />
      </div>

      {/* Map + Seasonal Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h2 className="section-title mb-3">{t('yourFarmFromAbove')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('exploreRegion')}</p>
          <InteractiveMap height="360px" farmName={currentFarm?.name || 'Selected Farm'} />
        </div>
        <div className="self-start rounded-xl border border-forest/10 bg-forest p-4 text-white shadow-sm dark:border-white/10 dark:bg-brand-800 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200">
              <Sprout className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">
                {t('healthyNextSeason')}
              </p>
              <h3 className="mt-1 text-lg font-bold leading-tight">{t('giveYourSoil')}</h3>
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{t('legumeSeason')}</p>

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-white/55">Example rotation</p>
            <div className="flex items-center gap-1.5 text-xs font-medium sm:gap-2">
              <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5">Rice</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden="true" />
              <span className="rounded-md border border-brand-200/30 bg-brand-200/15 px-2.5 py-1.5 text-brand-100">
                Mung Bean
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden="true" />
              <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5">Rice</span>
            </div>
          </div>

          <Link to="/crop-rotation" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-gray-100">
            {t('exploreRotation')} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-center text-[10px] text-white/50">Example guidance, not a yield guarantee.</p>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('rainfallTrend')}</p>
          </div>
          <p className="stat-value mb-3">{stats.totalRainfall} mm</p>
          <MiniBarChart data={rainfallData} color="#3b82f6" unit=" mm" />
          <DataSourceTag source={demoMode ? 'Historical (Sample)' : climateSource} />
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('temperatureTrend')}</p>
          </div>
          <p className="stat-value mb-3">{stats.avgTemperature} °C</p>
          <MiniBarChart data={tempData} color="#22c55e" unit="°C" />
          <DataSourceTag source={demoMode ? 'Historical (Sample)' : climateSource} />
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('soilMoisture')}</p>
          </div>
          <p className="stat-value mb-3">{stats.soilMoisture} %</p>
          <MiniLineChart data={moistureData} color="#14b8a6" unit="%" />
          <DataSourceTag source={demoMode ? 'Estimated (Sample)' : 'Estimated from NASA POWER'} />
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('solarRadiation')}</p>
          </div>
          <p className="stat-value mb-3">
            {solarData.length > 0 ? (solarData.reduce((s, d) => s + d.value, 0) / solarData.length).toFixed(1) : '4.8'} kWh/m²
          </p>
          <MiniLineChart data={solarData} color="#f59e0b" unit=" kWh" />
          <DataSourceTag source={demoMode ? 'Historical (Sample)' : climateSource} />
        </div>
      </div>
    </div>
  );
}
