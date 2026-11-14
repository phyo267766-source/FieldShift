import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { searchLocations } from '../data/myanmarLocations';

export default function InteractiveMap({
  height = '360px',
  showSearch = true,
  showGps = true,
  compact = false,
  farmName = '',
  locationKey = '',
}) {
  const { location, setLocation, detectCurrentLocation, gpsTracking } = useLocation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const farmNameRef = useRef('');
  const geocodeRequestRef = useRef(0);
  farmNameRef.current = farmName.trim() || 'Selected Farm';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Wait for Leaflet to be available
    const initMap = () => {
      if (typeof window.L === 'undefined') {
        setTimeout(initMap, 100);
        return;
      }

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [location.lat, location.lon],
        zoom: 8,
        zoomControl: false,
      });

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
          width: 36px; height: 36px;
          background: #1a3a1a;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "><div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          line-height: 1;
        ">📍</div></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      // Add draggable marker
      const marker = L.marker([location.lat, location.lon], {
        draggable: true,
        icon: markerIcon,
      }).addTo(map);

      marker.bindPopup(`<b>${farmNameRef.current}</b><br>${location.fullAddress || ''}`).openPopup();

      // Handle marker drag end
      marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(4));
        const lon = parseFloat(pos.lng.toFixed(4));
        await reverseGeocode(lat, lon);
      });

      // Handle map click to move marker
      map.on('click', async (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(4));
        const lon = parseFloat(e.latlng.lng.toFixed(4));
        marker.setLatLng([lat, lon]);
        await reverseGeocode(lat, lon);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when location changes externally
  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapInstanceRef.current) return;
    const marker = markerRef.current;
    const map = mapInstanceRef.current;
    const currentPos = marker.getLatLng();

    if (Math.abs(currentPos.lat - location.lat) > 0.0001 || Math.abs(currentPos.lng - location.lon) > 0.0001) {
      geocodeRequestRef.current += 1;
      marker.setLatLng([location.lat, location.lon]);
      map.flyTo([location.lat, location.lon], 10, { duration: 1 });
    }
    marker.setPopupContent(`<b>${farmNameRef.current}</b><br>${location.fullAddress || ''}`);
  }, [farmName, location, mapReady]);

  useEffect(() => {
    geocodeRequestRef.current += 1;
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [farmName, locationKey]);

  // Reverse geocode lat/lon to address
  const reverseGeocode = async (lat, lon) => {
    const requestId = ++geocodeRequestRef.current;
    const newLoc = { lat, lon, name: 'Selected Location', fullAddress: `${lat}°N, ${lon}°E` };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      newLoc.name = addr.village || addr.town || addr.city || addr.county || 'Selected Location';
      newLoc.region = addr.state || addr.county || '';
      newLoc.township = addr.town || addr.suburb || '';
      newLoc.fullAddress = data.display_name || `${lat}°N, ${lon}°E`;
    } catch {
      // Keep basic location if geocoding fails
    }
    if (requestId !== geocodeRequestRef.current) return;
    setLocation(newLoc);

    if (markerRef.current) {
      markerRef.current.setPopupContent(`<b>${farmNameRef.current}</b><br>${newLoc.fullAddress}`).openPopup();
    }
  };

  // Handle GPS detection
  const handleDetectGps = async () => {
    setDetecting(true);
    geocodeRequestRef.current += 1;
    try {
      const loc = await detectCurrentLocation();
      if (loc && mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([loc.lat, loc.lon]);
        mapInstanceRef.current.flyTo([loc.lat, loc.lon], 12, { duration: 1.5 });
        markerRef.current.setPopupContent(`<b>${farmNameRef.current}</b><br>${loc.fullAddress || ''}`).openPopup();
      }
    } catch (err) {
      console.warn('GPS detection failed:', err.message);
    } finally {
      setDetecting(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchLocations(query, 6);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Select a search result
  const selectLocation = (result) => {
    geocodeRequestRef.current += 1;
    const newLoc = {
      lat: result.lat,
      lon: result.lon,
      name: result.name,
      region: result.parent || '',
      township: result.type === 'township' ? result.name : '',
      fullAddress: `${result.name}, ${result.parent || 'Myanmar'}`,
    };
    setLocation(newLoc);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([result.lat, result.lon]);
      mapInstanceRef.current.flyTo([result.lat, result.lon], result.type === 'region' || result.type === 'state' ? 8 : 11, { duration: 1 });
      markerRef.current.setPopupContent(`<b>${farmNameRef.current}</b><br>${result.parent || 'Myanmar'}`).openPopup();
    }

    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      {/* Search bar */}
      {showSearch && (
        <div className="absolute top-3 left-3 right-14 z-[1000]">
          <div className="relative">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 shadow-md">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search Myanmar locations..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowResults(false); }}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(r)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-forest dark:text-brand-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {r.nameMm && `${r.nameMm} • `}{r.parent || r.type}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No locations found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GPS button */}
      {showGps && (
        <button
          onClick={handleDetectGps}
          disabled={detecting}
          className="absolute top-3 right-3 z-[1000] w-9 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Detect my location"
        >
          {detecting ? (
            <Loader2 className="w-4 h-4 text-forest dark:text-brand-300 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-forest dark:text-brand-300" />
          )}
        </button>
      )}

      {/* Map container */}
      <div ref={mapRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Location info bar */}
      {!compact && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Selected location</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {farmNameRef.current} • {location.lat}°N, {location.lon}°E
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {location.region ? `${location.region}, ` : ''}Myanmar
            {gpsTracking && <span className="text-green-500 ml-2">● GPS Active</span>}
          </p>
        </div>
      )}
    </div>
  );
}
