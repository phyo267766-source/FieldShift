import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
  lat: 16.77,
  lon: 94.73,
  name: 'Selected Location',
  region: 'Ayeyarwady',
  township: '',
  fullAddress: 'Ayeyarwady, Myanmar',
};

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem('fieldshift_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const locationRef = useRef(location);

  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const locationRequestRef = useRef(0);

  const setLocation = useCallback((loc) => {
    locationRequestRef.current += 1;
    const updated = { ...locationRef.current, ...loc };
    locationRef.current = updated;
    setLocationState(updated);
    try {
      localStorage.setItem('fieldshift_location', JSON.stringify(updated));
    } catch {}
  }, []);

  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsTracking(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lon: parseFloat(pos.coords.longitude.toFixed(4)),
          name: 'GPS Location',
          fullAddress: 'Current GPS position',
        });
      },
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    setGpsWatchId(id);
  }, [setLocation]);

  const stopGpsTracking = useCallback(() => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
    setGpsTracking(false);
  }, [gpsWatchId]);

  const detectCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      const requestId = ++locationRequestRef.current;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (requestId !== locationRequestRef.current) {
            resolve(null);
            return;
          }
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          // Reverse geocode
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const addr = data.address || {};
            const loc = {
              lat, lon,
              name: addr.village || addr.town || addr.city || 'GPS Location',
              region: addr.state || addr.county || '',
              township: addr.town || addr.suburb || '',
              fullAddress: data.display_name || 'Current GPS position',
            };
            if (requestId !== locationRequestRef.current) {
              resolve(null);
              return;
            }
            setLocation(loc);
            resolve(loc);
          } catch {
            if (requestId !== locationRequestRef.current) {
              resolve(null);
              return;
            }
            const loc = { lat, lon, name: 'GPS Location', fullAddress: 'Current GPS position' };
            setLocation(loc);
            resolve(loc);
          }
        },
        (err) => {
          if (requestId === locationRequestRef.current) reject(err);
          else resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [setLocation]);

  useEffect(() => {
    return () => {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  return (
    <LocationContext.Provider value={{
      location,
      setLocation,
      gpsTracking,
      startGpsTracking,
      stopGpsTracking,
      detectCurrentLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
