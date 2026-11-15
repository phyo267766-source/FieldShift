"""
Meteomatics Weather API Service
Provides current weather and forecasts via the Meteomatics REST API.
All API calls happen server-side; credentials never leave the backend.
"""
import requests
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class WeatherService:
    """Meteomatics Weather API client with Basic Auth."""

    BASE_URL = 'https://api.meteomatics.com'

    # Parameters we request
    CURRENT_PARAMS = [
        't_2m:C',           # temperature 2m in °C
        'relative_humidity_2m:p',  # relative humidity %
        'precip_1h:mm',     # precipitation last hour mm
        'wind_speed_10m:ms',  # wind speed 10m m/s
        'wind_dir_10m:d',   # wind direction degrees
        'msl_pressure:hPa', # mean sea level pressure
        'weather_symbol_1h:idx',  # weather icon index
    ]

    FORECAST_PARAMS = [
        't_2m:C',
        'relative_humidity_2m:p',
        'precip_1h:mm',
        'wind_speed_10m:ms',
        'prob_precip_1h:p',  # precipitation probability
        'weather_symbol_1h:idx',
    ]

    def __init__(self, username, password, timeout=20):
        self.username = username
        self.password = password
        self.timeout = timeout
        self._cache = {}  # simple in-memory cache: key -> (timestamp, data)
        self._cache_ttl = 600  # 10 minutes

    @property
    def configured(self):
        return bool(self.username and self.password)

    def _cache_key(self, *parts):
        return '|'.join(str(p) for p in parts)

    def _get_cached(self, key):
        if key in self._cache:
            ts, data = self._cache[key]
            if (datetime.now(timezone.utc) - ts).total_seconds() < self._cache_ttl:
                return data
            del self._cache[key]
        return None

    def _set_cache(self, key, data):
        self._cache[key] = (datetime.now(timezone.utc), data)

    def _request(self, path):
        """Make authenticated request to Meteomatics API."""
        url = f'{self.BASE_URL}/{path}'
        try:
            resp = requests.get(
                url,
                auth=(self.username, self.password),
                timeout=self.timeout,
                headers={'Accept': 'application/json'},
            )
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            if status == 401:
                raise WeatherAPIError('Invalid Meteomatics credentials. Check METEOMATICS_USERNAME and METEOMATICS_PASSWORD.')
            elif status == 403:
                raise WeatherAPIError('Meteomatics API access forbidden. Check your subscription.')
            elif status == 429:
                raise WeatherAPIError('Meteomatics API rate limit reached. Try again later.')
            else:
                raise WeatherAPIError(f'Meteomatics API error (HTTP {status}): {str(e)}')
        except requests.exceptions.Timeout:
            raise WeatherAPIError('Meteomatics API request timed out.')
        except requests.exceptions.ConnectionError:
            raise WeatherAPIError('Cannot connect to Meteomatics API. Check network connection.')
        except Exception as e:
            raise WeatherAPIError(f'Meteomatics API request failed: {str(e)}')

    def get_current_weather(self, lat, lon):
        """Get current weather conditions for a location."""
        if not self.configured:
            raise WeatherAPIError('Meteomatics credentials not configured.')

        cache_key = self._cache_key('current', round(lat, 3), round(lon, 3))
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        params = ','.join(self.CURRENT_PARAMS)
        path = f'{now}/{params}/{lat},{lon}/json'

        raw = self._request(path)
        result = self._parse_current(raw, lat, lon)
        self._set_cache(cache_key, result)
        return result

    def get_hourly_forecast(self, lat, lon, hours=24):
        """Get hourly forecast for next N hours."""
        if not self.configured:
            raise WeatherAPIError('Meteomatics credentials not configured.')

        cache_key = self._cache_key('hourly', round(lat, 3), round(lon, 3), hours)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        now = datetime.now(timezone.utc)
        end = now + timedelta(hours=hours)
        time_range = f'{now.strftime("%Y-%m-%dT%H:%M:%SZ")}--{end.strftime("%Y-%m-%dT%H:%M:%SZ")}:PT1H'
        params = ','.join(self.FORECAST_PARAMS)
        path = f'{time_range}/{params}/{lat},{lon}/json'

        raw = self._request(path)
        result = self._parse_forecast(raw, 'hourly')
        self._set_cache(cache_key, result)
        return result

    def get_daily_forecast(self, lat, lon, days=7):
        """Get daily forecast for next N days."""
        if not self.configured:
            raise WeatherAPIError('Meteomatics credentials not configured.')

        cache_key = self._cache_key('daily', round(lat, 3), round(lon, 3), days)
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        now = datetime.now(timezone.utc)
        end = now + timedelta(days=days)
        time_range = f'{now.strftime("%Y-%m-%dT%H:%M:%SZ")}--{end.strftime("%Y-%m-%dT%H:%M:%SZ")}:P1D'
        params = ','.join(self.FORECAST_PARAMS)
        path = f'{time_range}/{params}/{lat},{lon}/json'

        raw = self._request(path)
        result = self._parse_forecast(raw, 'daily')
        self._set_cache(cache_key, result)
        return result

    def _parse_current(self, raw, lat, lon):
        """Parse Meteomatics JSON response for current weather."""
        data = {}
        try:
            for item in raw.get('data', []):
                param = item.get('parameter', '')
                coords = item.get('coordinates', [{}])
                if coords and coords[0].get('dates'):
                    value = coords[0]['dates'][0].get('value')
                    data[param] = value
        except (KeyError, IndexError, TypeError) as e:
            logger.warning(f'Error parsing Meteomatics current data: {e}')

        return {
            'source': 'Meteomatics',
            'data_type': 'current',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'location': {'lat': lat, 'lon': lon},
            'temperature_c': data.get('t_2m:C'),
            'humidity_pct': data.get('relative_humidity_2m:p'),
            'precipitation_mm': data.get('precip_1h:mm'),
            'wind_speed_ms': data.get('wind_speed_10m:ms'),
            'wind_direction_deg': data.get('wind_dir_10m:d'),
            'pressure_hpa': data.get('msl_pressure:hPa'),
            'weather_symbol': data.get('weather_symbol_1h:idx'),
        }

    def _parse_forecast(self, raw, period_type):
        """Parse Meteomatics JSON response for forecast data."""
        # Organize by timestamp
        timestamps = {}
        try:
            for item in raw.get('data', []):
                param = item.get('parameter', '')
                coords = item.get('coordinates', [{}])
                if coords:
                    for date_entry in coords[0].get('dates', []):
                        ts = date_entry.get('date', '')
                        val = date_entry.get('value')
                        if ts not in timestamps:
                            timestamps[ts] = {}
                        timestamps[ts][param] = val
        except (KeyError, IndexError, TypeError) as e:
            logger.warning(f'Error parsing Meteomatics forecast: {e}')

        forecasts = []
        for ts in sorted(timestamps.keys()):
            d = timestamps[ts]
            forecasts.append({
                'timestamp': ts,
                'temperature_c': d.get('t_2m:C'),
                'humidity_pct': d.get('relative_humidity_2m:p'),
                'precipitation_mm': d.get('precip_1h:mm'),
                'wind_speed_ms': d.get('wind_speed_10m:ms'),
                'precip_probability_pct': d.get('prob_precip_1h:p'),
                'weather_symbol': d.get('weather_symbol_1h:idx'),
            })

        return {
            'source': 'Meteomatics',
            'data_type': f'forecast_{period_type}',
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'period_type': period_type,
            'forecasts': forecasts,
        }


class WeatherAPIError(Exception):
    """Custom exception for weather API errors."""
    pass
