import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, Save, RefreshCw, Loader2, AlertCircle, CheckCircle,
  Plus, Trash2, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocation } from '../contexts/LocationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import InteractiveMap from '../components/InteractiveMap';
import {
  getStateRegions, getDistricts, getTownships, getTownshipCoords,
} from '../data/myanmarAdmin';

const CROPS = ['Rice', 'Wheat', 'Maize', 'Mung Bean', 'Soybean', 'Sesame', 'Groundnut', 'Chickpea', 'Pigeon Pea', 'Sunflower'];
const SOIL_TYPES = ['Clay loam', 'Sandy loam', 'Silt loam', 'Clay', 'Sandy', 'Loam', 'Alluvial', 'Laterite'];
const IRRIGATION = ['Canal irrigation', 'Rain-fed', 'Drip irrigation', 'Sprinkler', 'Tube well', 'Pond/tank'];
const STATE_REGION_NAMES_MM = {
  Ayeyarwady: 'ဧရာဝတီ',
  Bago: 'ပဲခူး',
  Magway: 'မကွေး',
  Mandalay: 'မန္တလေး',
  Sagaing: 'စစ်ကိုင်း',
  Tanintharyi: 'တနင်္သာရီ',
  Yangon: 'ရန်ကုန်',
  Naypyidaw: 'နေပြည်တော်',
  Kachin: 'ကချင်ပြည်နယ်',
  Kayah: 'ကယားပြည်နယ်',
  Kayin: 'ကရင်ပြည်နယ်',
  Chin: 'ချင်းပြည်နယ်',
  Mon: 'မွန်ပြည်နယ်',
  Rakhine: 'ရခိုင်ပြည်နယ်',
  Shan: 'ရှမ်းပြည်နယ်',
};

function getFarmLocation(farm) {
  const lat = farm.latitude ?? 16.87;
  const lon = farm.longitude ?? 96.2;
  const region = farm.region || '';
  const address = [
    farm.township,
    farm.district,
    region,
    farm.country || 'Myanmar',
  ].filter(Boolean).join(', ');

  return {
    lat,
    lon,
    name: region || 'Selected Location',
    region,
    township: farm.township || '',
    fullAddress: address || `${lat}°N, ${lon}°E`,
  };
}

export default function MyFarm() {
  const { location, setLocation } = useLocation();
  const { t } = useLanguage();
  const {
    farms, currentFarm, saveFarm, createFarm, deleteFarm, selectFarm,
    backendAvailable, loading: farmLoading, DEFAULT_FARM,
  } = useFarm();

  const stateRegions = useMemo(() => getStateRegions(), []);

  const [form, setForm] = useState({ ...DEFAULT_FARM });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNewFarm, setIsNewFarm] = useState(false);

  // Cascading dropdowns
  const districts = useMemo(() => getDistricts(form.region), [form.region]);
  const townships = useMemo(() => getTownships(form.region, form.district), [form.region, form.district]);

  // Load form from currentFarm
  useEffect(() => {
    if (currentFarm && !isNewFarm) {
      setForm({
        name: currentFarm.name || '',
        country: currentFarm.country || 'Myanmar',
        region: currentFarm.region || '',
        district: currentFarm.district || '',
        township: currentFarm.township || '',
        latitude: currentFarm.latitude || 16.87,
        longitude: currentFarm.longitude || 96.2,
        area: currentFarm.area || '',
        area_unit: currentFarm.area_unit || 'acres',
        soil_type: currentFarm.soil_type || '',
        current_crop: currentFarm.current_crop || '',
        previous_crop: currentFarm.previous_crop || '',
        irrigation_method: currentFarm.irrigation_method || '',
        planting_season: currentFarm.planting_season || 'Monsoon',
      });
      setLocation(getFarmLocation(currentFarm));
    }
  }, [currentFarm]);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    // Reset dependent fields on cascading dropdown changes
    if (field === 'region') {
      next.district = '';
      next.township = '';
      // Auto-set coordinates from region
      const sr = stateRegions.find(s => s.name === value);
      if (sr) {
        next.latitude = sr.lat;
        next.longitude = sr.lon;
      }
    }
    if (field === 'district') {
      next.township = '';
      const dists = getDistricts(next.region);
      const d = dists.find(dd => dd.name === value);
      if (d) {
        next.latitude = d.lat;
        next.longitude = d.lon;
      }
    }
    if (field === 'township') {
      const coords = getTownshipCoords(next.region, next.district, value);
      if (coords) {
        next.latitude = coords.lat;
        next.longitude = coords.lon;
      }
    }
    setForm(next);
    if (['region', 'district', 'township'].includes(field)) {
      setLocation(getFarmLocation(next));
    }
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveError('Farm name is required.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        latitude: location.lat,
        longitude: location.lon,
      };
      if (isNewFarm) {
        await createFarm(payload);
        setIsNewFarm(false);
      } else {
        await saveFarm(payload);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = () => {
    setIsNewFarm(true);
    setForm({ ...DEFAULT_FARM, name: '' });
    setSaved(false);
    setSaveError(null);
  };

  const handleCancelNew = () => {
    setIsNewFarm(false);
    if (currentFarm) {
      // Re-load current farm into form
      setForm({
        name: currentFarm.name || '',
        country: 'Myanmar',
        region: currentFarm.region || '',
        district: currentFarm.district || '',
        township: currentFarm.township || '',
        area: currentFarm.area || '',
        area_unit: currentFarm.area_unit || 'acres',
        soil_type: currentFarm.soil_type || '',
        current_crop: currentFarm.current_crop || '',
        previous_crop: currentFarm.previous_crop || '',
        irrigation_method: currentFarm.irrigation_method || '',
        planting_season: currentFarm.planting_season || 'Monsoon',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentFarm?.id) return;
    try {
      await deleteFarm(currentFarm.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const handleFarmSwitch = (e) => {
    const farmId = e.target.value;
    if (farmId === '__new__') {
      handleAddNew();
      return;
    }
    const farm = farms.find(f => String(f.id) === farmId);
    if (farm) {
      setIsNewFarm(false);
      selectFarm(farm);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('farmManagement')}</p>
      <h1 className="page-header mt-1">{t('betterPlan')}</h1>
      <p className="page-subtitle">{t('keepGrowing')}</p>

      {/* Farm Switcher */}
      <div className="flex flex-wrap items-center gap-3 mt-6 mb-6">
        <div className="relative">
          <select
            className="select-field pr-10 min-w-[200px]"
            value={isNewFarm ? '__new__' : (currentFarm?.id || '')}
            onChange={handleFarmSwitch}
          >
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.name || 'Unnamed Farm'}</option>
            ))}
            <option value="__new__">+ Add New Farm</option>
          </select>
        </div>
        <button onClick={handleAddNew} className="btn-outline text-sm">
          <Plus className="w-4 h-4" /> New Farm
        </button>
        {currentFarm && farms.length > 1 && !isNewFarm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-outline text-sm text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
        {isNewFarm && (
          <button onClick={handleCancelNew} className="btn-outline text-sm">
            Cancel
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mb-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Delete "{currentFarm?.name}"? This cannot be undone.
          </p>
          <div className="flex gap-3 mt-3">
            <button onClick={handleDelete} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700">
              Yes, Delete
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Farm profile form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="section-title mb-1">
              {isNewFarm ? 'New Farm' : t('farmProfile')}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              {backendAvailable
                ? 'Your farm data is saved to the FieldShift database.'
                : 'Backend not connected. Data saved in browser only.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Farm Name */}
              <div>
                <label className="label">{t('farmName')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter farm name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                />
              </div>

              {/* State/Region — cascading level 1 */}
              <div>
                <label className="label">State / Region</label>
                <select
                  className="select-field"
                  value={form.region}
                  onChange={e => handleChange('region', e.target.value)}
                >
                  <option value="">Select State/Region</option>
                  {stateRegions.map(sr => (
                    <option key={sr.name} value={sr.name}>
                      {sr.name} ({STATE_REGION_NAMES_MM[sr.name] || sr.nameMm})
                    </option>
                  ))}
                </select>
              </div>

              {/* District — cascading level 2 */}
              <div>
                <label className="label">District</label>
                <select
                  className="select-field"
                  value={form.district}
                  onChange={e => handleChange('district', e.target.value)}
                  disabled={!form.region}
                >
                  <option value="">{form.region ? 'Select District' : '— Select State/Region first —'}</option>
                  {districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Township — cascading level 3 */}
              <div>
                <label className="label">Township</label>
                <select
                  className="select-field"
                  value={form.township}
                  onChange={e => handleChange('township', e.target.value)}
                  disabled={!form.district}
                >
                  <option value="">{form.district ? 'Select Township' : '— Select District first —'}</option>
                  {townships.map(tw => (
                    <option key={tw.name} value={tw.name}>{tw.name}</option>
                  ))}
                </select>
              </div>

              {/* GPS Coordinates (read-only, set by location selection or map) */}
              <div>
                <label className="label">GPS Coordinates</label>
                <input
                  type="text"
                  className="input-field"
                  value={`${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`}
                  readOnly
                />
              </div>

              {/* Farm Size */}
              <div>
                <label className="label">{t('farmSize')}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input-field flex-1"
                    placeholder="Area"
                    value={form.area}
                    onChange={e => handleChange('area', e.target.value)}
                  />
                  <select
                    className="select-field w-28"
                    value={form.area_unit}
                    onChange={e => handleChange('area_unit', e.target.value)}
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>

              {/* Soil Type */}
              <div>
                <label className="label">{t('soilType')}</label>
                <select className="select-field" value={form.soil_type} onChange={e => handleChange('soil_type', e.target.value)}>
                  <option value="">Select soil type</option>
                  {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Current Crop */}
              <div>
                <label className="label">{t('currentCrop')}</label>
                <select className="select-field" value={form.current_crop} onChange={e => handleChange('current_crop', e.target.value)}>
                  <option value="">Select crop</option>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Previous Crop */}
              <div>
                <label className="label">{t('previousCrop')}</label>
                <select className="select-field" value={form.previous_crop} onChange={e => handleChange('previous_crop', e.target.value)}>
                  <option value="">Select crop</option>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="label">{t('irrigationMethod')}</label>
                <select className="select-field" value={form.irrigation_method} onChange={e => handleChange('irrigation_method', e.target.value)}>
                  <option value="">Select method</option>
                  {IRRIGATION.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              {/* Season */}
              <div className="md:col-span-2">
                <label className="label">{t('plantingSeason')}</label>
                <select className="select-field" value={form.planting_season} onChange={e => handleChange('planting_season', e.target.value)}>
                  <option value="Monsoon">Monsoon (May–Oct)</option>
                  <option value="Winter">Winter (Nov–Feb)</option>
                  <option value="Summer">Summer (Mar–May)</option>
                </select>
              </div>
            </div>

            {/* Save / Reset */}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4" /> Saved!</>
                ) : (
                  <><Save className="w-4 h-4" /> {isNewFarm ? 'Create Farm' : t('saveFarmProfile')}</>
                )}
              </button>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" /> {saveError}
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              {backendAvailable
                ? 'Farm data is stored in the SQLite database.'
                : 'Saved in browser session. Start the Flask backend for persistent storage.'}
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Farm summary card */}
          {currentFarm && !isNewFarm && (
            <div className="card">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                ✦ Current Farm
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{form.name || 'Unnamed Farm'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {[form.township, form.district, form.region].filter(Boolean).join(', ') || 'Myanmar'}
              </p>
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
                {form.area && <span>{form.area} {form.area_unit}</span>}
                {form.area && form.soil_type && <span>•</span>}
                {form.soil_type && <span>{form.soil_type}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current season</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {form.current_crop || '—'} / {form.planting_season}
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-0.5">
                  <p>Previous crop: {form.previous_crop || '—'}</p>
                  <p>Irrigation: {form.irrigation_method || '—'}</p>
                </div>
              </div>
              <Link to="/crop-rotation" className="btn-primary mt-4 w-full justify-center">
                {t('planNextSeason')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Interactive map */}
          <div>
            <p className="section-title mb-3">{t('pinFarmLocation')}</p>
            <InteractiveMap
              height="240px"
              showSearch={true}
              showGps={true}
              farmName={isNewFarm ? form.name : currentFarm?.name || form.name}
              locationKey={`${isNewFarm ? 'new' : currentFarm?.id || ''}:${form.region}:${form.latitude}:${form.longitude}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
