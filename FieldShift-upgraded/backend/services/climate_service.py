"""
Climate analytics service.

Calculates averages, trends, seasonal summaries, and risk indicators
from stored or freshly fetched NASA POWER climate data.
"""
import json
import math
from datetime import datetime, timedelta
from database.db import query_db
from services.nasa_service import fetch_daily_climate
from config import Config


def get_climate_for_farm(
    farm_id, start_date=None, end_date=None, force_refresh=False,
    latitude=None, longitude=None,
):
    """
    Get climate data for a farm. Checks cache first, fetches from NASA if needed.

    Args:
        farm_id: The farm ID
        start_date: Start date 'YYYY-MM-DD' (defaults to 6 months ago)
        end_date: End date 'YYYY-MM-DD' (defaults to yesterday)
        force_refresh: If True, bypass cache and fetch fresh data

    Returns:
        dict with daily data, summary stats, and source info
    """
    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    if not farm:
        return {'success': False, 'error': 'Farm not found.', 'status_code': 404}

    try:
        farm_latitude = float(farm['latitude'])
        farm_longitude = float(farm['longitude'])
    except (TypeError, ValueError):
        return {'success': False, 'error': 'The selected farm has no valid coordinates.', 'status_code': 400}
    if (
        not math.isfinite(farm_latitude) or not -90 <= farm_latitude <= 90
        or not math.isfinite(farm_longitude) or not -180 <= farm_longitude <= 180
    ):
        return {'success': False, 'error': 'The selected farm has no valid coordinates.', 'status_code': 400}

    if (latitude is None) != (longitude is None):
        return {'success': False, 'error': 'Both farm latitude and longitude are required.', 'status_code': 400}
    if latitude is not None:
        try:
            requested_latitude = float(latitude)
            requested_longitude = float(longitude)
        except (TypeError, ValueError):
            return {'success': False, 'error': 'Farm coordinates must be valid numbers.', 'status_code': 400}
        if (
            not math.isfinite(requested_latitude) or not -90 <= requested_latitude <= 90
            or not math.isfinite(requested_longitude) or not -180 <= requested_longitude <= 180
        ):
            return {'success': False, 'error': 'Farm coordinates are outside valid latitude/longitude ranges.', 'status_code': 400}
        if (
            abs(requested_latitude - farm_latitude) > 0.00001
            or abs(requested_longitude - farm_longitude) > 0.00001
        ):
            return {'success': False, 'error': 'Submitted coordinates do not match the selected farm.', 'status_code': 400}

    if not end_date:
        end_dt = datetime.utcnow() - timedelta(days=1)
        end_date = end_dt.strftime('%Y-%m-%d')
    else:
        try:
            requested_end = datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            return {'success': False, 'error': 'end_date must use YYYY-MM-DD format.', 'status_code': 400}
        latest_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        end_date = min(requested_end, latest_date).strftime('%Y-%m-%d')
    if not start_date:
        start_dt = datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=180)
        start_date = start_dt.strftime('%Y-%m-%d')
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return {'success': False, 'error': 'start_date and end_date must use YYYY-MM-DD format.', 'status_code': 400}
    if start_dt > end_dt:
        return {'success': False, 'error': 'Start date must not be after end date.', 'status_code': 400}

    if not force_refresh:
        cached = _get_cached_data(
            farm_id, start_date, end_date, farm_latitude, farm_longitude
        )
        if cached is not None:
            data, retrieved_at = cached
            summary = _calculate_summary(data)
            return {
                'success': True,
                'data': data,
                'summary': summary,
                'risks': _assess_climate_risks(summary),
                'seasonal_patterns': _get_seasonal_patterns(data),
                'source': 'NASA POWER Daily API (AG)',
                'cached': True,
                'retrieved_at': retrieved_at,
                'last_observation': _latest_observation(data),
                'farm': {'id': farm['id'], 'name': farm['name']},
                'period': {'start': start_date, 'end': end_date},
                'location': {'latitude': farm_latitude, 'longitude': farm_longitude},
            }

    result = fetch_daily_climate(
        farm_latitude, farm_longitude, start_date, end_date
    )
    if not result['success']:
        return {
            'success': False,
            'error': result.get('error', 'Could not retrieve historical data from NASA POWER.'),
            'status_code': 502,
        }

    data = result['data']
    if not data:
        return {
            'success': False,
            'error': 'NASA POWER returned no historical observations for the selected period.',
            'status_code': 502,
        }
    _cache_climate_data(farm_id, data, farm_latitude, farm_longitude)
    summary = _calculate_summary(data)
    return {
        'success': True,
        'data': data,
        'summary': summary,
        'risks': _assess_climate_risks(summary),
        'seasonal_patterns': _get_seasonal_patterns(data),
        'source': result['source'],
        'retrieved_at': result['retrieved_at'],
        'last_observation': _latest_observation(data),
        'cached': False,
        'farm': {'id': farm['id'], 'name': farm['name']},
        'period': {'start': start_date, 'end': end_date},
        'location': {'latitude': farm_latitude, 'longitude': farm_longitude},
    }


def get_climate_history(
    farm_id, start_year=None, end_year=None, years=None, force_refresh=False,
    latitude=None, longitude=None,
):
    """
    Get monthly historical climate data for a farm.

    Args:
        farm_id: The farm ID
        start_year: Start year (defaults to 2 years ago)
        end_year: End year (defaults to last year)

    Returns:
        dict with monthly data and summary
    """
    current_year = datetime.utcnow().year
    if years is None:
        end_year = end_year or current_year - 1
        start_year = start_year or end_year - 1
        years = list(range(start_year, end_year + 1))
    if not years or len(years) > 10 or any(
        not isinstance(year, int) or year < 1981 or year > current_year
        for year in years
    ):
        return {
            'success': False,
            'error': f'Choose between 1 and 10 years from 1981 through {current_year}.',
            'status_code': 400,
        }

    records = []
    retrieved_at = None
    for year in sorted(set(years)):
        result = get_climate_for_farm(
            farm_id,
            start_date=f'{year}-01-01',
            end_date=f'{year}-12-31',
            force_refresh=force_refresh,
            latitude=latitude,
            longitude=longitude,
        )
        if not result['success']:
            return result
        records.extend(result['data'])
        if result.get('retrieved_at') and (
            retrieved_at is None or result['retrieved_at'] > retrieved_at
        ):
            retrieved_at = result['retrieved_at']

    monthly_data = _aggregate_daily_by_month(records)
    metric_names = (
        'rainfall', 'temperature', 'temperature_max', 'temperature_min',
        'humidity', 'soil_wetness', 'solar_radiation',
    )
    yearly_data = {}
    for year in sorted(set(years)):
        yearly_data[year] = {
            metric: [
                next((
                    row[metric] for row in monthly_data
                    if row['year'] == year and row['month_num'] == month
                ), None)
                for month in range(1, 13)
            ]
            for metric in metric_names
        }

    farm = query_db('SELECT id, name, latitude, longitude FROM farms WHERE id = ?', (farm_id,), one=True)
    if not farm:
        return {'success': False, 'error': 'Farm not found.', 'status_code': 404}

    return {
        'success': True,
        'data': records,
        'monthly_data': monthly_data,
        'yearly_data': yearly_data,
        'source': 'NASA POWER Daily API (AG), aggregated from daily observations',
        'retrieved_at': retrieved_at,
        'last_observation': _latest_observation(records),
        'farm': {'id': farm['id'], 'name': farm['name']},
        'location': {'latitude': farm['latitude'], 'longitude': farm['longitude']},
        'period': {'years': sorted(set(years))},
    }


def get_climate_summary(farm_id):
    """
    Get a high-level climate summary for a farm.
    Uses cached data if available, otherwise fetches fresh.
    """
    climate = get_climate_for_farm(farm_id)
    if not climate['success']:
        return climate

    summary = climate.get('summary', {})
    risks = _assess_climate_risks(summary)
    seasonal = _get_seasonal_patterns(climate['data'])

    return {
        'success': True,
        'summary': summary,
        'risks': risks,
        'seasonal_patterns': seasonal,
        'source': climate.get('source', 'Unknown'),
        'retrieved_at': climate.get('retrieved_at'),
        'last_observation': climate.get('last_observation'),
        'farm': climate.get('farm'),
        'period': climate.get('period'),
    }


def _calculate_summary(data):
    """Calculate summary statistics from daily climate records."""
    if not data:
        return {}

    temps = [d['temperature'] for d in data if d.get('temperature') is not None]
    rains = [d['rainfall'] for d in data if d.get('rainfall') is not None]
    solars = [d['solar_radiation'] for d in data if d.get('solar_radiation') is not None]
    humids = [d['humidity'] for d in data if d.get('humidity') is not None]
    wetness = [d['soil_wetness'] for d in data if d.get('soil_wetness') is not None]
    temp_max = [d['temperature_max'] for d in data if d.get('temperature_max') is not None]
    temp_min = [d['temperature_min'] for d in data if d.get('temperature_min') is not None]

    summary = {
        'record_count': len(data),
        'date_range': {
            'start': data[0]['date'] if data else None,
            'end': data[-1]['date'] if data else None,
        },
    }

    if temps:
        summary['temperature'] = {
            'average': round(sum(temps) / len(temps), 1),
            'min': round(min(temps), 1),
            'max': round(max(temps), 1),
            'unit': '°C',
        }
    elif temp_max or temp_min:
        summary['temperature'] = {'unit': '°C'}
    if temp_max:
        summary['temperature']['observed_max'] = round(max(temp_max), 1)
    if temp_min:
        summary['temperature']['observed_min'] = round(min(temp_min), 1)

    if rains:
        summary['rainfall'] = {
            'total': round(sum(rains), 1),
            'average_daily': round(sum(rains) / len(rains), 1),
            'max_daily': round(max(rains), 1),
            'rainy_days': sum(1 for r in rains if r > 1.0),
            'unit': 'mm',
        }

    if solars:
        summary['solar_radiation'] = {
            'average': round(sum(solars) / len(solars), 1),
            'unit': 'kWh/m²/day',
        }

    if humids:
        summary['humidity'] = {
            'average': round(sum(humids) / len(humids), 1),
            'unit': '%',
        }

    if wetness:
        summary['soil_wetness'] = {
            'average': round(sum(wetness) / len(wetness), 3),
            'unit': 'unitless fraction',
        }

    return summary


def _assess_climate_risks(summary):
    """Assess climate risks based on summary statistics."""
    risks = []

    temp = summary.get('temperature', {})
    if temp:
        avg_t = temp.get('average', 0)
        max_t = temp.get('max', 0)
        if max_t > 38:
            risks.append({
                'risk': 'Heat stress',
                'level': 'High',
                'description': f'Maximum temperature reached {max_t}°C. '
                               f'Protect heat-sensitive crop phases.',
            })
        elif max_t > 35:
            risks.append({
                'risk': 'Heat stress',
                'level': 'Moderate',
                'description': f'Some warm days above 35°C detected. '
                               f'Monitor crop stress indicators.',
            })
        else:
            risks.append({
                'risk': 'Heat stress',
                'level': 'Low',
                'description': 'Temperature within comfortable range for most crops.',
            })

    rain = summary.get('rainfall', {})
    if rain:
        total = rain.get('total', 0)
        max_daily = rain.get('max_daily', 0)
        if max_daily > 80:
            risks.append({
                'risk': 'Heavy rainfall risk',
                'level': 'High',
                'description': f'Extreme daily rainfall of {max_daily} mm recorded. '
                               f'Check drainage and flood-prone areas.',
            })
        elif max_daily > 50:
            risks.append({
                'risk': 'Heavy rainfall risk',
                'level': 'Moderate',
                'description': f'Significant rainfall events detected. '
                               f'Track flood-prone areas during the production window.',
            })
        else:
            risks.append({
                'risk': 'Heavy rainfall risk',
                'level': 'Low',
                'description': 'No extreme rainfall events detected in this period.',
            })

        avg_daily = rain.get('average_daily', 0)
        if avg_daily < 1.0 and total < 200:
            risks.append({
                'risk': 'Drought risk',
                'level': 'High',
                'description': f'Very low rainfall ({total} mm total). '
                               f'Irrigation is likely essential.',
            })
        elif avg_daily < 3.0:
            risks.append({
                'risk': 'Drought risk',
                'level': 'Moderate',
                'description': 'Below-average rainfall. Monitor soil moisture closely.',
            })
        else:
            risks.append({
                'risk': 'Drought risk',
                'level': 'Low',
                'description': 'Adequate rainfall for most crops.',
            })

    return risks


def _get_seasonal_patterns(data):
    """Group daily data into seasonal summaries."""
    if not data:
        return []

    # Group by month
    monthly = {}
    for record in data:
        try:
            dt = datetime.strptime(record['date'], '%Y-%m-%d')
            month_key = dt.strftime('%Y-%m')
            month_name = dt.strftime('%b')
        except (ValueError, KeyError):
            continue

        if month_key not in monthly:
            monthly[month_key] = {
                'month': month_name,
                'year_month': month_key,
                'temps': [],
                'rains': [],
                'solars': [],
                'humidities': [],
                'wetness': [],
            }

        if record.get('temperature') is not None:
            monthly[month_key]['temps'].append(record['temperature'])
        if record.get('rainfall') is not None:
            monthly[month_key]['rains'].append(record['rainfall'])
        if record.get('solar_radiation') is not None:
            monthly[month_key]['solars'].append(record['solar_radiation'])
        if record.get('humidity') is not None:
            monthly[month_key]['humidities'].append(record['humidity'])
        if record.get('soil_wetness') is not None:
            monthly[month_key]['wetness'].append(record['soil_wetness'])

    # Calculate monthly averages
    result = []
    for key in sorted(monthly.keys()):
        m = monthly[key]
        entry = {'month': m['month'], 'year_month': m['year_month']}
        if m['temps']:
            entry['avg_temperature'] = round(sum(m['temps']) / len(m['temps']), 1)
        if m['rains']:
            entry['total_rainfall'] = round(sum(m['rains']), 1)
        if m['solars']:
            entry['avg_solar'] = round(sum(m['solars']) / len(m['solars']), 1)
        if m['humidities']:
            entry['avg_humidity'] = round(sum(m['humidities']) / len(m['humidities']), 1)
        if m['wetness']:
            entry['avg_soil_wetness'] = round(sum(m['wetness']) / len(m['wetness']), 3)
        result.append(entry)

    return result


def _aggregate_daily_by_month(data):
    """Aggregate observed daily values into calendar-month totals and means."""
    grouped = {}
    for record in data:
        try:
            observed = datetime.strptime(record['date'], '%Y-%m-%d')
        except (KeyError, TypeError, ValueError):
            continue
        key = (observed.year, observed.month)
        bucket = grouped.setdefault(key, {
            'rainfall': [],
            'temperature': [],
            'temperature_max': [],
            'temperature_min': [],
            'humidity': [],
            'soil_wetness': [],
            'solar_radiation': [],
        })
        for field in bucket:
            value = record.get(field)
            if value is not None:
                bucket[field].append(value)

    month_names = ('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    monthly_data = []
    for (year, month_num), values in sorted(grouped.items()):
        entry = {
            'year': year,
            'month': month_names[month_num - 1],
            'month_num': month_num,
            'year_month': f'{year}-{month_num:02d}',
        }
        for field, observations in values.items():
            if not observations:
                entry[field] = None
            elif field == 'rainfall':
                entry[field] = round(sum(observations), 2)
            elif field == 'temperature_max':
                entry[field] = round(max(observations), 2)
            elif field == 'temperature_min':
                entry[field] = round(min(observations), 2)
            else:
                entry[field] = round(sum(observations) / len(observations), 2)
        monthly_data.append(entry)
    return monthly_data


def _get_cached_data(farm_id, start_date, end_date, latitude, longitude):
    """Return a fresh cache entry only when every requested date is present."""
    from database.db import query_db

    rows = query_db(
        '''SELECT observation_date, observation_data, retrieved_at
           FROM climate_observation_cache
           WHERE farm_id = ? AND latitude = ? AND longitude = ?
             AND observation_date >= ? AND observation_date <= ?
             AND retrieved_at >= datetime('now', ?)
           ORDER BY observation_date''',
        (
            farm_id, latitude, longitude, start_date, end_date,
            f'-{Config.CLIMATE_CACHE_HOURS} hours',
        )
    )
    expected_days = (
        datetime.strptime(end_date, '%Y-%m-%d')
        - datetime.strptime(start_date, '%Y-%m-%d')
    ).days + 1
    if len(rows) != expected_days:
        return None

    try:
        data = [json.loads(row['observation_data']) for row in rows]
    except (TypeError, json.JSONDecodeError):
        return None
    return data, max(row['retrieved_at'] for row in rows)


def _cache_climate_data(farm_id, daily_data, latitude, longitude):
    """Cache complete NASA POWER daily observations for a farm and location."""
    from database.db import get_connection

    retrieved_at = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_connection()
    try:
        conn.executemany(
            '''INSERT INTO climate_observation_cache
               (farm_id, observation_date, latitude, longitude, observation_data, retrieved_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(farm_id, observation_date) DO UPDATE SET
                 latitude = excluded.latitude,
                 longitude = excluded.longitude,
                 observation_data = excluded.observation_data,
                 retrieved_at = excluded.retrieved_at''',
            [
                (
                    farm_id,
                    record['date'],
                    latitude,
                    longitude,
                    json.dumps(record, separators=(',', ':')),
                    retrieved_at,
                )
                for record in daily_data
            ],
        )
        conn.commit()
    finally:
        conn.close()


def _latest_observation(data):
    """Return the most recent date containing at least one valid measurement."""
    for record in reversed(data):
        if any(value is not None for key, value in record.items() if key != 'date'):
            return record.get('date')
    return None
