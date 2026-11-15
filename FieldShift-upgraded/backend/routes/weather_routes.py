"""
Weather API routes — proxies Meteomatics API calls through Flask backend.
Credentials never leave the server.
"""
from flask import Blueprint, request, jsonify, current_app
from services.weather_service import WeatherService, WeatherAPIError
from utils.validators import validate_coordinates

weather_bp = Blueprint('weather', __name__, url_prefix='/api/weather')

_weather_service = None


def get_weather_service():
    """Lazy-init weather service from app config."""
    global _weather_service
    if _weather_service is None:
        cfg = current_app.config
        _weather_service = WeatherService(
            username=cfg.get('METEOMATICS_USERNAME', ''),
            password=cfg.get('METEOMATICS_PASSWORD', ''),
            timeout=cfg.get('METEOMATICS_TIMEOUT', 20),
        )
    return _weather_service


@weather_bp.route('/status', methods=['GET'])
def weather_status():
    """Check if Meteomatics API is configured."""
    svc = get_weather_service()
    return jsonify({
        'configured': svc.configured,
        'message': 'Meteomatics API credentials configured.' if svc.configured
                   else 'Meteomatics credentials not set. Add METEOMATICS_USERNAME and METEOMATICS_PASSWORD to .env file.',
    })


@weather_bp.route('/current', methods=['GET'])
def current_weather():
    """Get current weather for given coordinates.
    Query params: lat, lon
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    if lat is None or lon is None:
        return jsonify({'error': 'lat and lon query parameters are required.'}), 400
    is_valid, err_msg = validate_coordinates(lat, lon)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    svc = get_weather_service()
    if not svc.configured:
        return jsonify({
            'error': 'Meteomatics API not configured.',
            'configured': False,
        }), 503

    try:
        data = svc.get_current_weather(lat, lon)
        return jsonify(data)
    except WeatherAPIError as e:
        return jsonify({'error': str(e)}), 502


@weather_bp.route('/forecast/hourly', methods=['GET'])
def hourly_forecast():
    """Get hourly forecast.
    Query params: lat, lon, hours (default 24)
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    hours = request.args.get('hours', 24, type=int)
    hours = min(max(hours, 1), 72)

    if lat is None or lon is None:
        return jsonify({'error': 'lat and lon query parameters are required.'}), 400
    is_valid, err_msg = validate_coordinates(lat, lon)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    svc = get_weather_service()
    if not svc.configured:
        return jsonify({'error': 'Meteomatics API not configured.', 'configured': False}), 503

    try:
        data = svc.get_hourly_forecast(lat, lon, hours)
        return jsonify(data)
    except WeatherAPIError as e:
        return jsonify({'error': str(e)}), 502


@weather_bp.route('/forecast/daily', methods=['GET'])
def daily_forecast():
    """Get daily forecast.
    Query params: lat, lon, days (default 7)
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    days = request.args.get('days', 7, type=int)
    days = min(max(days, 1), 14)

    if lat is None or lon is None:
        return jsonify({'error': 'lat and lon query parameters are required.'}), 400
    is_valid, err_msg = validate_coordinates(lat, lon)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    svc = get_weather_service()
    if not svc.configured:
        return jsonify({'error': 'Meteomatics API not configured.', 'configured': False}), 503

    try:
        data = svc.get_daily_forecast(lat, lon, days)
        return jsonify(data)
    except WeatherAPIError as e:
        return jsonify({'error': str(e)}), 502
