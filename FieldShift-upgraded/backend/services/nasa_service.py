"""
NASA POWER API integration service.

Fetches real historical climate data from NASA's POWER (Prediction of Worldwide
Energy Resources) API. This is a free, public API — no key required.

API docs: https://power.larc.nasa.gov/docs/services/api/

Parameters used:
  T2M        - Temperature at 2 Meters (°C)
  PRECTOTCORR - Precipitation Corrected (mm/day)
  ALLSKY_SFC_SW_DWN - All Sky Surface Shortwave Downward Irradiance (kWh/m²/day)
  RH2M       - Relative Humidity at 2 Meters (%)
  WS2M       - Wind Speed at 2 Meters (m/s)
"""
import requests
from datetime import datetime, timedelta
from config import Config


# NASA POWER parameters we request
POWER_PARAMETERS = (
    'PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,RH2M,GWETROOT,'
    'ALLSKY_SFC_SW_DWN,WS2M'
)
MAX_DAILY_RANGE_DAYS = 3660
POWER_FILL_VALUE = -999


def fetch_daily_climate(latitude, longitude, start_date, end_date):
    """
    Fetch daily climate data from NASA POWER API.

    Args:
        latitude: Farm latitude (-90 to 90)
        longitude: Farm longitude (-180 to 180)
        start_date: Start date string 'YYYY-MM-DD'
        end_date: End date string 'YYYY-MM-DD'

    Returns:
        dict with 'success', 'data' (list of daily records), 'source', 'retrieved_at'
        On failure: dict with 'success': False, 'error' message
    """
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        if start_dt > end_dt:
            return {'success': False, 'error': 'Start date must not be after end date.'}
        if start_dt < datetime(1981, 1, 1):
            return {'success': False, 'error': 'NASA POWER daily data starts on 1981-01-01.'}
        if (end_dt - start_dt).days + 1 > MAX_DAILY_RANGE_DAYS:
            return {'success': False, 'error': 'A climate request cannot exceed ten years.'}

        daily_records = []
        current_start = start_dt
        while current_start <= end_dt:
            current_end = min(current_start + timedelta(days=365), end_dt)
            params = {
                'parameters': POWER_PARAMETERS,
                'community': 'AG',
                'longitude': longitude,
                'latitude': latitude,
                'start': current_start.strftime('%Y%m%d'),
                'end': current_end.strftime('%Y%m%d'),
                'format': 'JSON',
                'time-standard': 'UTC',
            }
            response = requests.get(
                f'{Config.NASA_POWER_BASE_URL}/daily/point',
                params=params,
                timeout=Config.NASA_POWER_TIMEOUT,
            )
            response.raise_for_status()
            result = response.json()
            parameters = result.get('properties', {}).get('parameter', {})
            if not isinstance(parameters, dict) or not parameters:
                return {
                    'success': False,
                    'error': 'NASA POWER returned no data for this location and date range.',
                }

            date_keys = set()
            for parameter_values in parameters.values():
                if isinstance(parameter_values, dict):
                    date_keys.update(parameter_values.keys())

            for date_key in date_keys:
                try:
                    observation_date = datetime.strptime(date_key, '%Y%m%d')
                except (TypeError, ValueError):
                    continue
                if not current_start <= observation_date <= current_end:
                    continue

                def value(parameter):
                    return _clean_value(parameters.get(parameter, {}).get(date_key))

                solar_mj = value('ALLSKY_SFC_SW_DWN')
                daily_records.append({
                    'date': observation_date.strftime('%Y-%m-%d'),
                    'temperature': value('T2M'),
                    'temperature_max': value('T2M_MAX'),
                    'temperature_min': value('T2M_MIN'),
                    'rainfall': value('PRECTOTCORR'),
                    'humidity': value('RH2M'),
                    'soil_wetness': value('GWETROOT'),
                    'solar_radiation': round(solar_mj / 3.6, 2) if solar_mj is not None else None,
                    'solar_radiation_mj': solar_mj,
                    'wind_speed': value('WS2M'),
                })
            current_start = current_end + timedelta(days=1)

        daily_records.sort(key=lambda record: record['date'])
        if not daily_records or not any(
            value is not None
            for record in daily_records
            for key, value in record.items()
            if key != 'date'
        ):
            return {
                'success': False,
                'error': 'NASA POWER has no valid observations for this location and date range yet.',
            }

        return {
            'success': True,
            'data': daily_records,
            'source': 'NASA POWER Daily API (AG)',
            'retrieved_at': datetime.utcnow().isoformat() + 'Z',
            'location': {'latitude': latitude, 'longitude': longitude},
            'period': {
                'start': start_dt.strftime('%Y-%m-%d'),
                'end': end_dt.strftime('%Y-%m-%d'),
            },
            'parameters': {
                'temperature': 'T2M — °C',
                'temperature_max': 'T2M_MAX — °C',
                'temperature_min': 'T2M_MIN — °C',
                'rainfall': 'PRECTOTCORR — mm/day',
                'humidity': 'RH2M — %',
                'soil_wetness': 'GWETROOT — unitless fraction',
                'solar_radiation': 'ALLSKY_SFC_SW_DWN — MJ/m²/day converted to kWh/m²/day',
                'wind_speed': 'WS2M — m/s',
            },
        }
    except ValueError as exc:
        return {'success': False, 'error': f'Invalid climate date: {exc}.'}
    except requests.exceptions.Timeout:
        return {'success': False, 'error': 'NASA POWER API request timed out. Please try again later.'}
    except requests.exceptions.ConnectionError:
        return {'success': False, 'error': 'Could not connect to NASA POWER API. Check your internet connection.'}
    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 'unknown'
        return {'success': False, 'error': f'NASA POWER API returned HTTP {status}.'}
    except requests.exceptions.RequestException as exc:
        return {'success': False, 'error': f'NASA POWER API request failed: {exc}.'}
    except (TypeError, AttributeError) as exc:
        return {'success': False, 'error': f'NASA POWER returned an invalid response: {exc}.'}


def fetch_monthly_climate(latitude, longitude, start_year, end_year):
    """
    Fetch monthly averaged climate data from NASA POWER API.

    Args:
        latitude: Farm latitude
        longitude: Farm longitude
        start_year: Start year (int)
        end_year: End year (int)

    Returns:
        dict with monthly averages per parameter
    """
    try:
        params = {
            'parameters': POWER_PARAMETERS,
            'community': 'AG',
            'longitude': longitude,
            'latitude': latitude,
            'start': start_year,
            'end': end_year,
            'format': 'JSON',
        }
        response = requests.get(
            f'{Config.NASA_POWER_BASE_URL}/monthly/point',
            params=params,
            timeout=Config.NASA_POWER_TIMEOUT,
        )
        response.raise_for_status()
        result = response.json()

        properties = result.get('properties', {})
        parameters = properties.get('parameter', {})

        if not parameters:
            return {
                'success': False,
                'error': 'No monthly data returned from NASA POWER.',
            }

        # Build monthly records
        # Keys are in format "YYYYMM" for monthly data
        monthly_records = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        t2m_data = parameters.get('T2M', {})

        for date_key, temp_value in t2m_data.items():
            if date_key == '13':  # Annual average key
                continue
            try:
                year = int(date_key[:4])
                month_num = int(date_key[4:6])
                if month_num < 1 or month_num > 12:
                    continue
                month_name = month_names[month_num - 1]
            except (IndexError, ValueError):
                continue

            record = {
                'year': year,
                'month': month_name,
                'month_num': month_num,
                'temperature': _clean_value(temp_value),
                'temperature_max': _clean_value(parameters.get('T2M_MAX', {}).get(date_key)),
                'temperature_min': _clean_value(parameters.get('T2M_MIN', {}).get(date_key)),
                'rainfall': _clean_value(parameters.get('PRECTOTCORR', {}).get(date_key)),
                'solar_radiation': (
                    round(_clean_value(parameters.get('ALLSKY_SFC_SW_DWN', {}).get(date_key)) / 3.6, 2)
                    if _clean_value(parameters.get('ALLSKY_SFC_SW_DWN', {}).get(date_key)) is not None
                    else None
                ),
                'humidity': _clean_value(parameters.get('RH2M', {}).get(date_key)),
                'soil_wetness': _clean_value(parameters.get('GWETROOT', {}).get(date_key)),
                'wind_speed': _clean_value(parameters.get('WS2M', {}).get(date_key)),
            }
            monthly_records.append(record)

        monthly_records.sort(key=lambda r: (r['year'], r['month_num']))

        return {
            'success': True,
            'data': monthly_records,
            'source': 'NASA POWER v2 — Monthly averages',
            'retrieved_at': datetime.utcnow().isoformat() + 'Z',
            'location': {'latitude': latitude, 'longitude': longitude},
            'period': {'start_year': start_year, 'end_year': end_year},
        }

    except requests.exceptions.Timeout:
        return {'success': False, 'error': 'NASA POWER API request timed out.'}
    except requests.exceptions.ConnectionError:
        return {'success': False, 'error': 'Could not connect to NASA POWER API.'}
    except Exception as e:
        return {'success': False, 'error': f'Error fetching monthly data: {str(e)}'}


def _clean_value(value):
    """
    Clean a NASA POWER value.
    POWER uses -999 or -999.0 for missing data.
    Returns None for missing values, rounded float otherwise.
    """
    if value is None:
        return None
    try:
        v = float(value)
        if v <= POWER_FILL_VALUE:
            return None
        return round(v, 2)
    except (TypeError, ValueError):
        return None
