import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { farmApi } from '../api/client';

const FarmContext = createContext(null);

const DEFAULT_FARM = {
  name: 'My Farm',
  country: 'Myanmar',
  region: '',
  district: '',
  township: '',
  latitude: 16.87,
  longitude: 96.2,
  area: '',
  area_unit: 'acres',
  soil_type: '',
  current_crop: '',
  previous_crop: '',
  irrigation_method: '',
  planting_season: 'Monsoon',
};

export function FarmProvider({ children }) {
  const [farms, setFarms] = useState([]);
  const [currentFarm, setCurrentFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    loadFarms();
  }, []);

  /* ---- Helpers for localStorage multi-farm ---- */
  const getLocalFarms = () => {
    try {
      const raw = localStorage.getItem('fieldshift_farms');
      if (raw) return JSON.parse(raw);
      // migrate old single-farm key
      const old = localStorage.getItem('fieldshift_farm');
      if (old) {
        const f = { ...DEFAULT_FARM, ...JSON.parse(old), id: `local_${Date.now()}` };
        localStorage.setItem('fieldshift_farms', JSON.stringify([f]));
        localStorage.removeItem('fieldshift_farm');
        return [f];
      }
    } catch {}
    return [];
  };

  const saveLocalFarms = (list) => {
    localStorage.setItem('fieldshift_farms', JSON.stringify(list));
  };

  /* ---- Load ---- */
  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await farmApi.getAll();
      const serverFarms = data.farms || [];
      setFarms(serverFarms);
      setBackendAvailable(true);
      // Restore selected farm or pick first
      const savedId = localStorage.getItem('fieldshift_selected_farm_id');
      const match = savedId && serverFarms.find(f => String(f.id) === savedId);
      setCurrentFarm(match || serverFarms[0] || null);
    } catch (err) {
      console.warn('Backend not available, using local mode:', err.message);
      setBackendAvailable(false);
      const local = getLocalFarms();
      if (local.length === 0) {
        const seed = { ...DEFAULT_FARM, id: `local_${Date.now()}` };
        local.push(seed);
        saveLocalFarms(local);
      }
      setFarms(local);
      const savedId = localStorage.getItem('fieldshift_selected_farm_id');
      const match = savedId && local.find(f => String(f.id) === savedId);
      setCurrentFarm(match || local[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Select ---- */
  const selectFarm = useCallback((farm) => {
    setCurrentFarm(farm);
    if (farm?.id) localStorage.setItem('fieldshift_selected_farm_id', String(farm.id));
  }, []);

  /* ---- Create ---- */
  const createFarm = useCallback(async (farmData) => {
    setError(null);
    try {
      if (backendAvailable) {
        const data = await farmApi.create(farmData);
        await loadFarms();
        selectFarm(data.farm);
        return data.farm;
      } else {
        const newFarm = { ...DEFAULT_FARM, ...farmData, id: `local_${Date.now()}` };
        const updated = [...farms, newFarm];
        saveLocalFarms(updated);
        setFarms(updated);
        selectFarm(newFarm);
        return newFarm;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [backendAvailable, farms, loadFarms, selectFarm]);

  /* ---- Update ---- */
  const saveFarm = useCallback(async (farmData) => {
    setError(null);
    try {
      if (backendAvailable) {
        if (currentFarm && currentFarm.id) {
          const data = await farmApi.update(currentFarm.id, farmData);
          const savedFarm = data.farm;
          setFarms(previous =>
            previous.map(farm =>
              String(farm.id) === String(savedFarm.id) ? savedFarm : farm
            )
          );
          setCurrentFarm(savedFarm);
          localStorage.setItem('fieldshift_selected_farm_id', String(savedFarm.id));
          return savedFarm;
        } else {
          return await createFarm(farmData);
        }
      } else {
        const merged = { ...currentFarm, ...farmData };
        const updated = farms.map(f => f.id === merged.id ? merged : f);
        saveLocalFarms(updated);
        setFarms(updated);
        setCurrentFarm(merged);
        return merged;
      }
    } catch (err) {
      setError(err.message);
      try { localStorage.setItem('fieldshift_farm_backup', JSON.stringify(farmData)); } catch {}
      throw err;
    }
  }, [backendAvailable, currentFarm, farms, createFarm, loadFarms]);

  /* ---- Delete ---- */
  const deleteFarm = useCallback(async (farmId) => {
    setError(null);
    try {
      if (backendAvailable && farmId && !String(farmId).startsWith('local_')) {
        await farmApi.delete(farmId);
        await loadFarms();
      } else {
        const updated = farms.filter(f => f.id !== farmId);
        saveLocalFarms(updated);
        setFarms(updated);
        if (currentFarm?.id === farmId) {
          setCurrentFarm(updated[0] || null);
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [backendAvailable, farms, currentFarm, loadFarms]);

  return (
    <FarmContext.Provider value={{
      farms,
      currentFarm,
      loading,
      error,
      backendAvailable,
      saveFarm,
      createFarm,
      deleteFarm,
      selectFarm,
      loadFarms,
      DEFAULT_FARM,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
