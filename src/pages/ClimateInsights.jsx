import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Calendar, TrendingUp, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import DataSourceTag from '../components/DataSourceTag';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { climateApi } from '../api/client';

const riskColors = {
  Low: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  Moderate: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
  High: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 5 + index);
const YEAR_COLORS = ['#2d5a2d', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const METRICS = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: '#2d5a2d', icon: '🌧️' },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#22c55e', icon: '🌡️' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#3b82f6', icon: '💧' },
  { key: 'solar', label: 'Solar Radiation', unit: 'kWh/m²/day', color: '#f59e0b', icon: '☀️' },
  { key: 'soil_wetness', label: 'Root-Zone Wetness', unit: 'fraction', color: '#8b5cf6', icon: '🌱' },
];

const API_METRICS = {
  rainfall: 'rainfall',
  temperature: 'temperature',
  humidity: 'humidity',
  solar: 'solar_radiation',
  soil_wetness: 'soil_wetness',
};

function aggregateDaily(records) {
  const grouped = new Map();
  records.forEach(record => {
    const key = record.date.slice(0, 7);
    if (!grouped.has(key)) {
      grouped.set(key, {
        year: Number(key.slice(0, 4)),
        month_num: Number(key.slice(5, 7)),
        month: MONTH_NAMES[Number(key.slice(5, 7)) - 1],
        year_month: key,
        rainfall: [],
        temperature: [],
        humidity: [],
        solar_radiation: [],
        soil_wetness: [],
      });
    }
    const month = grouped.get(key);
    Object.keys(API_METRICS).forEach(metric => {
      const field = API_METRICS[metric];
      if (record[field] != null) month[field === 'solar_radiation' ? 'solar_radiation' : field].push(record[field]);
    });
  });

  return [...grouped.values()].map(month => ({
    ...month,
    rainfall: month.rainfall.length
      ? month.rainfall.reduce((sum, value) => sum + value, 0)
      : null,
    temperature: average(month.temperature),
    humidity: average(month.humidity),
    solar_radiation: average(month.solar_radiation),
    soil_wetness: average(month.soil_wetness),
  }));
}

function getLatestTwelveMonths(records) {
  const validRecords = records.filter(record =>
    Object.values(API_METRICS).some(metric => record[metric] != null)
  );
  if (!validRecords.length) {
    return { records: [], months: [], dateRange: '', latestMonthIncomplete: false };
  }

  const latestDate = validRecords
    .map(record => record.date)
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1);
  if (!latestDate) {
    return { records: [], months: [], dateRange: '', latestMonthIncomplete: false };
  }

  const latestMonth = latestDate.slice(0, 7);
  const [latestYear, latestMonthNumber] = latestMonth.split('-').map(Number);
  const start = new Date(Date.UTC(latestYear, latestMonthNumber - 12, 1));
  const startMonth = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  const filteredRecords = validRecords.filter(record =>
    record.date.slice(0, 7) >= startMonth && record.date.slice(0, 7) <= latestMonth
  );
  const observedMonths = new Map(aggregateDaily(filteredRecords).map(month => [month.year_month, month]));
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return observedMonths.get(key) || {
      year: date.getUTCFullYear(),
      month_num: date.getUTCMonth() + 1,
      month: MONTH_NAMES[date.getUTCMonth()],
      year_month: key,
      rainfall: null,
      temperature: null,
      humidity: null,
      solar_radiation: null,
      soil_wetness: null,
    };
  });

  const [year, month] = latestMonth.split('-').map(Number);
  const monthEndDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const latestMonthIncomplete = Number(latestDate.slice(8, 10)) < monthEndDay;
  const dateRange = `${formatMonthYear(startMonth)} – ${formatMonthYear(latestMonth)}${
    latestMonthIncomplete ? ' · latest month incomplete' : ''
  }`;

  return { records: filteredRecords, months, dateRange, latestMonthIncomplete };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function sumObservations(records, field) {
  const values = records.map(record => record[field]).filter(value => value != null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function makeSeries(records, field, daily, monthlySource = null) {
  const source = daily ? records : (monthlySource || aggregateDaily(records));
  return source
    .filter(record => !daily || record[field] != null)
    .map(record => ({
      month: daily
        ? record.date
        : record.month,
      date: daily ? record.date : record.year_month,
      value: record[field] == null
        ? null
        : Number(record[field].toFixed(field === 'soil_wetness' ? 3 : 1)),
    }));
}

function formatMonthYear(dateString) {
  const [year, month] = dateString.slice(0, 7).split('-').map(Number);
  return `${new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })} ${year}`;
}

function formatFullDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDataRange(records, daily) {
  if (!records.length) return '';
  const dates = records
    .map(record => record.date)
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  if (!dates.length) return '';

  const start = daily ? formatFullDate(dates[0]) : formatMonthYear(dates[0]);
  const end = daily ? formatFullDate(dates[dates.length - 1]) : formatMonthYear(dates[dates.length - 1]);
  return start === end ? start : `${start} – ${end}`;
}

function formatAxisTick(value, daily) {
  if (!daily) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const monthName = MONTH_NAMES[Number(month) - 1];
  return Number(day) === 1 ? `${monthName} ${year}` : `${monthName} ${Number(day)}`;
}

function formatTooltipDate(label, payload) {
  const date = payload?.[0]?.payload?.date;
  if (!date) return label;
  return date.length === 7 ? formatMonthYear(date) : formatFullDate(date);
}

function ChartCard({ title, value, unit, data, daily, dateRangeLabel, type = 'bar', color = '#2d5a2d', dataSource, note }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {dateRangeLabel && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{dateRangeLabel}</p>
      )}
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {value} <span className="text-base font-normal text-gray-500">{unit}</span>
      </p>
      <ResponsiveContainer width="100%" height={140}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tickFormatter={value => formatAxisTick(value, daily)} interval={daily ? 'preserveStartEnd' : 0} minTickGap={daily ? 16 : 0} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={formatTooltipDate} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`area-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickFormatter={value => formatAxisTick(value, daily)} interval={daily ? 'preserveStartEnd' : 0} minTickGap={daily ? 16 : 0} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={formatTooltipDate} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#area-${title.replace(/\s/g, '')})`} />
          </AreaChart>
        )}
      </ResponsiveContainer>
      <DataSourceTag source={dataSource} />
      {note && <p className="text-[10px] text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

// Year comparison chart
function YearComparisonChart({ metric, yearData, selectedYears }) {
  const chartData = MONTH_NAMES.map((month, i) => {
    const point = { month };
    selectedYears.forEach(year => {
      const yd = yearData[year];
      if (yd && yd[i] != null) {
        point[`y${year}`] = yd[i];
      }
    });
    return point;
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{metric.icon}</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.label} — Year Comparison</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {selectedYears.map((year, idx) => (
            <Line
              key={year}
              type="monotone"
              dataKey={`y${year}`}
              name={String(year)}
              stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 mt-2">
        {metric.unit} per month • NASA POWER daily observations aggregated by calendar month
      </p>
    </div>
  );
}

export default function ClimateInsights() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | comparison | detailed
  const [view, setView] = useState('Monthly');
  const [selectedMetric, setSelectedMetric] = useState('rainfall');
  const [selectedYears, setSelectedYears] = useState([CURRENT_YEAR - 2, CURRENT_YEAR - 1]);
  const [dateRange, setDateRange] = useState(() => ({
    start: `${CURRENT_YEAR - 1}-01`,
    end: `${CURRENT_YEAR - 1}-12`,
  }));
  const { t } = useLanguage();
  const {
    farms, currentFarm, selectFarm, backendAvailable, loading: farmsLoading,
  } = useFarm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyPayload, setDailyPayload] = useState(null);
  const [comparisonPayload, setComparisonPayload] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const lastRefreshVersion = useRef(0);

  const selectedYearsKey = selectedYears.join(',');
  const farmId = currentFarm?.id;
  const latitude = currentFarm?.latitude == null || currentFarm.latitude === ''
    ? Number.NaN
    : Number(currentFarm.latitude);
  const longitude = currentFarm?.longitude == null || currentFarm.longitude === ''
    ? Number.NaN
    : Number(currentFarm.longitude);
  const dailyViewKey = activeTab === 'detailed'
    ? `detailed:${dateRange.start}:${dateRange.end}`
    : activeTab;

  useEffect(() => {
    if (farmsLoading) return undefined;
    let active = true;

    const fetchClimate = async () => {
      setLoading(false);
      if (!currentFarm) {
        setError('Select a farm to load NASA POWER climate observations.');
        return;
      }
      if (!backendAvailable) {
        setError('The Flask backend is unavailable. Start it to load NASA POWER climate observations.');
        return;
      }
      if (!Number.isSafeInteger(Number(farmId)) || Number(farmId) <= 0) {
        setError('Climate observations require a farm saved in the backend.');
        return;
      }
      if (
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      ) {
        setError('The selected farm has no valid latitude and longitude. Update its coordinates before loading climate data.');
        return;
      }
      if (activeTab === 'comparison' && selectedYears.length === 0) {
        setComparisonPayload(null);
        setError('Select at least one year to compare.');
        return;
      }

      const forceRefresh = refreshVersion !== lastRefreshVersion.current;
      lastRefreshVersion.current = refreshVersion;
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'comparison') {
          const response = await climateApi.getHistory(farmId, {
            years: selectedYearsKey,
            latitude,
            longitude,
            refresh: forceRefresh ? 'true' : 'false',
          });
          if (!Array.isArray(response.data) || !response.yearly_data) {
            throw new Error('NASA POWER returned an invalid year-comparison response.');
          }
          if (active) {
            setComparisonPayload({
              ...response,
              farmId: String(farmId),
              yearsKey: selectedYearsKey,
            });
          }
        } else {
          let startDate;
          let endDate;
          if (activeTab === 'detailed') {
            if (!/^\d{4}-\d{2}$/.test(dateRange.start) || !/^\d{4}-\d{2}$/.test(dateRange.end)) {
              throw new Error('Choose a valid start and end month.');
            }
            if (dateRange.start > dateRange.end) {
              throw new Error('The start month must not be after the end month.');
            }
            const start = new Date(`${dateRange.start}-01T00:00:00Z`);
            const end = new Date(`${dateRange.end}-01T00:00:00Z`);
            startDate = `${dateRange.start}-01`;
            endDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0))
              .toISOString().slice(0, 10);
            if ((end - start) / (1000 * 60 * 60 * 24) > 3660) {
              throw new Error('Detailed analysis is limited to ten years per request.');
            }
          } else {
            const end = new Date();
            end.setUTCHours(0, 0, 0, 0);
            end.setUTCDate(end.getUTCDate() - 1);
            const start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 364);
            startDate = start.toISOString().slice(0, 10);
            endDate = end.toISOString().slice(0, 10);
          }

          const response = await climateApi.getFarmClimate(farmId, {
            start_date: startDate,
            end_date: endDate,
            latitude,
            longitude,
            refresh: forceRefresh ? 'true' : 'false',
          });
          if (!Array.isArray(response.data)) {
            throw new Error('NASA POWER returned an invalid daily observation response.');
          }
          const hasObservations = response.data.some(record =>
            Object.values(API_METRICS).some(key => record[key] != null)
          );
          if (!hasObservations) {
            throw new Error('No valid NASA POWER observations are available for this farm and date range yet.');
          }
          if (active) {
            setDailyPayload({
              ...response,
              farmId: String(farmId),
              viewKey: dailyViewKey,
            });
          }
        }
      } catch (requestError) {
        const details = Array.isArray(requestError.details)
          ? requestError.details.join(' ')
          : requestError.details;
        if (active) {
          setError(details
            ? `${requestError.message} ${details}`
            : requestError.message || 'Could not load NASA POWER climate observations.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchClimate();
    return () => {
      active = false;
    };
  }, [
    activeTab,
    backendAvailable,
    currentFarm,
    dateRange.end,
    dateRange.start,
    dailyViewKey,
    farmsLoading,
    farmId,
    latitude,
    longitude,
    refreshVersion,
    selectedYearsKey,
  ]);

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].slice(-4)
    );
  };

  const visibleDailyPayload = dailyPayload?.farmId === String(farmId)
    && dailyPayload?.viewKey === dailyViewKey
    ? dailyPayload
    : null;
  const visibleComparisonPayload = activeTab === 'comparison'
    && comparisonPayload?.farmId === String(farmId)
    && comparisonPayload?.yearsKey === selectedYearsKey
    ? comparisonPayload
    : null;
  const dailyRecords = visibleDailyPayload?.data || [];
  const isDailyView = view === 'Daily';
  const monthlyWindow = useMemo(() => getLatestTwelveMonths(dailyRecords), [dailyRecords]);
  const displayedRecords = isDailyView ? dailyRecords : monthlyWindow.records;
  const rainfallData = makeSeries(dailyRecords, 'rainfall', isDailyView, monthlyWindow.months);
  const temperatureData = makeSeries(dailyRecords, 'temperature', isDailyView, monthlyWindow.months);
  const moistureData = makeSeries(dailyRecords, 'humidity', isDailyView, monthlyWindow.months);
  const solarData = makeSeries(dailyRecords, 'solar_radiation', isDailyView, monthlyWindow.months);
  const rainfallTotal = sumObservations(displayedRecords, 'rainfall');
  const totalRainfall = rainfallTotal != null
    ? rainfallTotal.toFixed(1)
    : '—';
  const avgTemp = average(displayedRecords.map(record => record.temperature).filter(value => value != null));
  const avgMoisture = average(displayedRecords.map(record => record.humidity).filter(value => value != null));
  const avgSolar = average(displayedRecords.map(record => record.solar_radiation).filter(value => value != null));
  const formattedTemp = avgTemp == null ? '—' : avgTemp.toFixed(1);
  const formattedMoisture = avgMoisture == null ? '—' : avgMoisture.toFixed(1);
  const formattedSolar = avgSolar == null ? '—' : avgSolar.toFixed(1);
  const sourceLabel = visibleDailyPayload || visibleComparisonPayload
    ? 'NASA POWER'
    : 'NASA POWER (no data loaded)';
  const period = visibleDailyPayload?.period;
  const noteText = visibleDailyPayload
    ? `Source: NASA POWER Agroclimatology (AG). ${currentFarm?.name || 'Selected farm'}; ${period?.start} to ${period?.end}. Latest observation: ${visibleDailyPayload.last_observation || 'not available'}.`
    : visibleComparisonPayload
      ? `Source: NASA POWER Agroclimatology (AG). Years: ${visibleComparisonPayload.period?.years?.join(', ') || selectedYearsKey}. Latest observation: ${visibleComparisonPayload.last_observation || 'not available'}.`
      : 'Historical observations are retrieved from NASA POWER. No sample values are displayed.';
  const risks = visibleDailyPayload?.risks || [];
  const seasons = useMemo(() => aggregateDaily(dailyRecords).slice(-8).reverse().map(month => ({
    season: month.year_month,
    description: [
      month.rainfall != null ? `${month.rainfall.toFixed(1)} mm observed rainfall` : null,
      month.temperature != null ? `${month.temperature.toFixed(1)}°C mean temperature` : null,
    ].filter(Boolean).join(' • ') || 'No valid observations for this month.',
  })), [dailyRecords]);
  const comparisonYearData = useMemo(() => {
    const values = {};
    AVAILABLE_YEARS.forEach(year => {
      const apiKey = API_METRICS[selectedMetric] || selectedMetric;
      values[year] = visibleComparisonPayload?.yearly_data?.[year]?.[apiKey]
        || Array(12).fill(null);
    });
    return values;
  }, [visibleComparisonPayload, selectedMetric]);
  const validDetailRange = /^\d{4}-\d{2}$/.test(dateRange.start)
    && /^\d{4}-\d{2}$/.test(dateRange.end);
  const detailRecords = validDetailRange
    ? dailyRecords.filter(record =>
      record.date >= `${dateRange.start}-01` &&
      record.date <= new Date(Date.UTC(
        Number(dateRange.end.slice(0, 4)),
        Number(dateRange.end.slice(5, 7)),
        0,
      )).toISOString().slice(0, 10)
    )
    : [];
  const detailSeries = makeSeries(detailRecords, API_METRICS[selectedMetric] || 'rainfall', true);
  const chartDateRange = isDailyView
    ? formatDataRange(dailyRecords, true)
    : monthlyWindow.dateRange;
  const detailDateRange = formatDataRange(detailRecords, true);

  const currentMetric = METRICS.find(m => m.key === selectedMetric) || METRICS[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'comparison', label: 'Year Comparison', icon: TrendingUp },
    { id: 'detailed', label: 'Detailed Analysis', icon: Calendar },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('earthObservations')}</p>
      <h1 className="page-header mt-1">{t('understandClimate')}</h1>
      <p className="page-subtitle">{t('seasonalContext')}</p>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 mt-6 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-forest dark:text-brand-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
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

        {activeTab === 'overview' && (
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {['Daily', 'Monthly'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-forest dark:bg-brand-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {v === 'Daily' ? t('daily') : t('monthly')}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="select-field w-auto"
            />
            <span className="text-sm text-gray-400">to</span>
            <input
              type="month"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="select-field w-auto"
            />
          </div>
        )}

        {currentFarm && (
          <button
            onClick={() => setRefreshVersion(version => version + 1)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh NASA POWER climate data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Data source tags */}
      {activeTab !== 'comparison' && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
            {sourceLabel}
          </span>
          {visibleDailyPayload?.retrieved_at && (
            <span className="text-[10px] text-gray-400">
              Last successful update: {new Date(visibleDailyPayload.retrieved_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Fetching climate data...</span>
        </div>
      )}

      {/* ====== OVERVIEW TAB ====== */}
      {!loading && activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ChartCard
              title="Historical Rainfall Analysis"
              value={totalRainfall} unit="mm"
              data={rainfallData} color="#2d5a2d"
              daily={isDailyView} dateRangeLabel={chartDateRange}
              dataSource={sourceLabel} note={noteText}
            />
            <ChartCard
              title="Temperature Trends"
              value={formattedTemp} unit="°C"
              data={temperatureData} type="bar" color="#22c55e"
              daily={isDailyView} dateRangeLabel={chartDateRange}
              dataSource={sourceLabel} note={noteText}
            />
            <ChartCard
              title="Relative Humidity"
              value={formattedMoisture} unit="%"
              data={moistureData} type="bar" color="#3b82f6"
              daily={isDailyView} dateRangeLabel={chartDateRange}
              dataSource={sourceLabel} note={noteText}
            />
            <ChartCard
              title="Solar Radiation"
              value={formattedSolar} unit="kWh/m²/day"
              data={solarData} type="line" color="#f59e0b"
              daily={isDailyView} dateRangeLabel={chartDateRange}
              dataSource={sourceLabel} note={noteText}
            />
          </div>

          {/* Bottom section: Seasonal + Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="section-title mb-4">Seasonal Climate Patterns</h3>
              <div className="space-y-4">
                {seasons.map((s, i) => (
                  <div key={i} className="border-l-2 border-brand-300 dark:border-brand-500 pl-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.season}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title mb-4">Climate Risk Assessment</h3>
              <div className="space-y-3">
                {risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        r.level === 'Low' ? 'bg-green-500' : r.level === 'Moderate' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${riskColors[r.level]}`}>
                        {r.risk} • {r.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.description || 'Assessment based on observed NASA POWER data.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====== YEAR COMPARISON TAB ====== */}
      {!loading && activeTab === 'comparison' && (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-3 sm:p-4 mb-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)] lg:gap-6">
              <section aria-label="Climate Parameters" className="min-w-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Climate Parameters
                </h3>
                <div className="flex flex-wrap gap-2">
                  {METRICS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMetric(m.key)}
                      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs sm:text-sm font-medium transition-colors ${
                        selectedMetric === m.key
                          ? 'border-forest bg-forest text-white dark:border-brand-600 dark:bg-brand-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-sm leading-none" aria-hidden="true">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section aria-label="Compare Years" className="min-w-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Compare Years
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_YEARS.map(year => {
                    const isSelected = selectedYears.includes(year);
                    return (
                      <button
                        key={year}
                        onClick={() => toggleYear(year)}
                        aria-pressed={isSelected}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs sm:text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-forest bg-forest text-white dark:border-brand-600 dark:bg-brand-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{year}</span>
                        {year === CURRENT_YEAR && (
                          <span
                            title="Partial-year data"
                            className={`rounded px-1 py-0.5 text-[9px] font-medium leading-none ${
                              isSelected
                                ? 'bg-white/15 text-white/80'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            Partial
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200/80 pt-3 dark:border-gray-700">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {visibleComparisonPayload ? 'NASA POWER' : 'NASA POWER data not loaded'}
              </span>
              {visibleComparisonPayload?.retrieved_at && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  Last successful update: {new Date(visibleComparisonPayload.retrieved_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Comparison chart */}
          <YearComparisonChart
            metric={currentMetric}
            yearData={comparisonYearData}
            selectedYears={selectedYears}
          />

          {/* Year summary table */}
          <div className="card mt-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Annual {currentMetric.label} Summary
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 font-medium">Year</th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    {currentMetric.key === 'rainfall' ? 'Total' : 'Average'}
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">Min (month)</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Max (month)</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {selectedYears.map(year => {
                  const data = comparisonYearData[year] || [];
                  const validData = data.filter(v => v != null);
                  if (validData.length === 0) return null;
                  const total = validData.reduce((s, v) => s + v, 0);
                  const avg = total / validData.length;
                  const min = Math.min(...validData);
                  const max = Math.max(...validData);
                  const minMonth = MONTH_NAMES[data.indexOf(min)];
                  const maxMonth = MONTH_NAMES[data.indexOf(max)];
                  const prevYear = comparisonYearData[year - 1];
                  let trend = null;
                  if (prevYear) {
                    const prevTotal = prevYear.filter(v => v != null).reduce((s, v) => s + v, 0);
                    const prevAvg = prevTotal / prevYear.filter(v => v != null).length;
                    const ref = currentMetric.key === 'rainfall' ? prevTotal : prevAvg;
                    const cur = currentMetric.key === 'rainfall' ? total : avg;
                    trend = ref > 0 ? ((cur - ref) / ref * 100) : null;
                  }

                  return (
                    <tr key={year} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-medium text-gray-900 dark:text-gray-100">
                        {year}{year === CURRENT_YEAR ? '*' : ''}
                      </td>
                      <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                        {currentMetric.key === 'rainfall' ? Math.round(total) : avg.toFixed(1)} {currentMetric.unit}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {min.toFixed(1)} ({minMonth})
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {max.toFixed(1)} ({maxMonth})
                      </td>
                      <td className="py-2 text-right">
                        {trend != null ? (
                          <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {selectedYears.includes(CURRENT_YEAR) && (
              <p className="text-[10px] text-gray-400 mt-2">* {CURRENT_YEAR} data may be incomplete. Only observed data is shown.</p>
            )}
          </div>
        </>
      )}

      {/* ====== DETAILED ANALYSIS TAB ====== */}
      {!loading && activeTab === 'detailed' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {METRICS.map(m => {
              const field = API_METRICS[m.key];
              const values = detailRecords
                .map(record => record[field])
                .filter(value => value != null);
              const total = sumObservations(detailRecords, field);
              const avg = average(values);
              const summary = values.length === 0
                ? '—'
                : m.key === 'rainfall'
                  ? `${total.toFixed(1)} ${m.unit}`
                  : `${avg.toFixed(m.key === 'soil_wetness' ? 3 : 1)} ${m.unit}`;

              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className={`card text-left transition-all ${
                    selectedMetric === m.key ? 'ring-2 ring-forest dark:ring-brand-500' : ''
                  }`}
                >
                  <p className="text-lg mb-1">{m.icon}</p>
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{summary}</p>
                  <p className="text-[10px] text-gray-400">
                    {m.key === 'rainfall' ? 'Total' : 'Average'} • {dateRange.start} to {dateRange.end}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed chart for selected metric */}
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {currentMetric.icon} {currentMetric.label} — Detailed View
            </h3>
            {detailDateRange && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-3 mb-2">{detailDateRange}</p>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={detailSeries}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="month" tickFormatter={value => formatAxisTick(value, true)} interval="preserveStartEnd" minTickGap={16} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={formatTooltipDate}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [`${v} ${currentMetric.unit}`, currentMetric.label]}
                />
                <Bar dataKey="value" fill={currentMetric.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <DataSourceTag source={sourceLabel} />
            <p className="text-[10px] text-gray-400 mt-1">{noteText}</p>
          </div>

          {/* Statistics summary */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Statistical Summary — {currentMetric.label}
            </h3>
            {(() => {
              const field = API_METRICS[selectedMetric];
              const observedRecords = detailRecords.filter(record => record[field] != null);
              const values = observedRecords.map(record => record[field]);
              const total = sumObservations(detailRecords, field) || 0;
              const avg = average(values);
              const min = values.length > 0 ? Math.min(...values) : null;
              const max = values.length > 0 ? Math.max(...values) : null;
              const range = max - min;
              const minMonth = observedRecords[values.indexOf(min)]?.date || '—';
              const maxMonth = observedRecords[values.indexOf(max)]?.date || '—';
              const precision = selectedMetric === 'soil_wetness' ? 3 : 1;

              const statItems = [
                { label: 'Total', value: `${total.toFixed(1)} ${currentMetric.unit}`, show: selectedMetric === 'rainfall' },
                { label: 'Average', value: avg == null ? '—' : `${avg.toFixed(precision)} ${currentMetric.unit}`, show: true },
                { label: 'Minimum', value: min == null ? '—' : `${min.toFixed(precision)} ${currentMetric.unit} (${minMonth})`, show: true },
                { label: 'Maximum', value: max == null ? '—' : `${max.toFixed(precision)} ${currentMetric.unit} (${maxMonth})`, show: true },
                { label: 'Range', value: min == null ? '—' : `${range.toFixed(precision)} ${currentMetric.unit}`, show: true },
                { label: 'Data Points', value: `${values.length} days`, show: true },
              ];

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {statItems.filter(s => s.show).map(s => (
                    <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
