"""
Climate data API routes.
Endpoints for fetching and analyzing NASA POWER climate data.
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from services.climate_service import (
    get_climate_for_farm,
    get_climate_history,
    get_climate_summary,
)
from services.notification_service import create_notification
from utils.validators import validate_coordinates

climate_bp = Blueprint('climate', __name__)


@climate_bp.route('/api/climate/farm/<int:farm_id>', methods=['GET'])
def farm_climate(farm_id):
    """
    Get daily climate data for a farm.

    Query params:
      start_date - YYYY-MM-DD (default: 6 months ago)
      end_date   - YYYY-MM-DD (default: yesterday)
      refresh    - 'true' to bypass cache
      latitude, longitude - optional coordinates to verify against the farm
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'

    result = get_climate_for_farm(
        farm_id,
        start_date=start_date,
        end_date=end_date,
        force_refresh=force_refresh,
        latitude=request.args.get('latitude'),
        longitude=request.args.get('longitude'),
    )

    if not result['success']:
        return jsonify(result), result.get('status_code', 502)

    has_observations = any(
        record.get(metric) is not None
        for record in result.get('data', [])
        for metric in (
            'rainfall', 'temperature', 'temperature_max', 'temperature_min',
            'humidity', 'soil_wetness', 'solar_radiation',
        )
    )
    if (
        not result.get('cached')
        and result.get('last_observation')
        and has_observations
    ):
        farm = result.get('farm') or {}
        farm_name = farm.get('name', f'Farm {farm_id}')
        last_observation = result['last_observation']
        create_notification(
            'climate',
            'Climate Data Updated',
            f'NASA POWER historical data for {farm_name} is available through {last_observation}.',
            f'climate-update:{farm_id}:{last_observation}',
        )

    return jsonify(result), 200


@climate_bp.route('/api/climate/history/<int:farm_id>', methods=['GET'])
def climate_history(farm_id):
    """
    Get daily historical climate data and monthly aggregates for a farm.

    Query params:
      years      - comma-separated calendar years (optional)
      start_year, end_year - range used when years is omitted
      refresh    - 'true' to bypass cache
      latitude, longitude - optional coordinates to verify against the farm
    """
    start_year = request.args.get('start_year', type=int)
    end_year = request.args.get('end_year', type=int)
    years_arg = request.args.get('years')
    years = None
    if years_arg:
        try:
            years = [int(year) for year in years_arg.split(',')]
        except ValueError:
            return jsonify({'error': 'years must be comma-separated calendar years.'}), 400
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'

    result = get_climate_history(
        farm_id,
        start_year,
        end_year,
        years=years,
        force_refresh=force_refresh,
        latitude=request.args.get('latitude'),
        longitude=request.args.get('longitude'),
    )

    if not result['success']:
        return jsonify(result), result.get('status_code', 502)

    return jsonify(result), 200


@climate_bp.route('/api/climate/summary/<int:farm_id>', methods=['GET'])
def climate_summary(farm_id):
    """
    Get a high-level climate summary with risk assessment.
    """
    result = get_climate_summary(farm_id)

    if not result['success']:
        return jsonify(result), result.get('status_code', 502)

    return jsonify(result), 200


@climate_bp.route('/api/climate/coordinates', methods=['GET'])
def climate_by_coordinates():
    """
    Get climate data for arbitrary coordinates (without saving a farm).

    Query params:
      lat        - latitude
      lon        - longitude
      start_date - YYYY-MM-DD
      end_date   - YYYY-MM-DD
    """
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not lat or not lon:
        return jsonify({'error': 'lat and lon query parameters are required.'}), 400

    is_valid, error = validate_coordinates(lat, lon)
    if not is_valid:
        return jsonify({'error': error}), 400

    end_date = request.args.get('end_date') or (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d')
    start_date = request.args.get('start_date')
    if not start_date:
        try:
            start_date = (
                datetime.strptime(end_date, '%Y-%m-%d') - timedelta(days=180)
            ).strftime('%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'end_date must use YYYY-MM-DD format.'}), 400

    from services.nasa_service import fetch_daily_climate
    result = fetch_daily_climate(float(lat), float(lon), start_date, end_date)

    if not result['success']:
        return jsonify(result), 502

    return jsonify(result), 200
