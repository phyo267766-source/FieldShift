"""Focused tests for NASA POWER climate retrieval and aggregation."""
import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config


class ClimateTestConfig(Config):
    TESTING = True
    DEBUG = False


@pytest.fixture
def client(monkeypatch):
    with tempfile.TemporaryDirectory() as directory:
        ClimateTestConfig.DATABASE_PATH = os.path.join(directory, 'climate-test.db')
        app = create_app(ClimateTestConfig)
        with app.test_client() as test_client:
            yield test_client


def create_farm(client):
    response = client.post('/api/farms', json={
        'name': 'NASA Test Farm',
        'country': 'Myanmar',
        'region': 'Mandalay',
        'latitude': 21.9588,
        'longitude': 96.0891,
        'area': 5,
        'soil_type': 'Clay loam',
        'current_crop': 'Rice',
        'previous_crop': 'Mung Bean',
        'irrigation_method': 'Canal irrigation',
        'planting_season': 'Monsoon',
    })
    assert response.status_code == 201
    return response.get_json()['farm']['id']


def sample_record(date, rainfall):
    return {
        'date': date,
        'temperature': 26.5,
        'temperature_max': 31.0,
        'temperature_min': 22.0,
        'rainfall': rainfall,
        'humidity': 74.0,
        'soil_wetness': 0.42,
        'solar_radiation': 5.1,
        'solar_radiation_mj': 18.36,
        'wind_speed': 2.0,
    }


def successful_nasa_response(latitude, longitude, start_date, end_date):
    return {
        'success': True,
        'data': [
            sample_record(start_date, 1.25),
            sample_record(start_date[:8] + '02', 2.25),
        ],
        'source': 'NASA POWER Daily API (AG)',
        'retrieved_at': '2025-01-03T00:00:00Z',
        'location': {'latitude': latitude, 'longitude': longitude},
        'period': {'start': start_date, 'end': end_date},
    }


def test_farm_daily_data_uses_nasa_observations_and_cache(client, monkeypatch):
    from services import climate_service

    farm_id = create_farm(client)
    calls = []

    def fake_fetch(latitude, longitude, start_date, end_date):
        calls.append((latitude, longitude, start_date, end_date))
        return successful_nasa_response(latitude, longitude, start_date, end_date)

    monkeypatch.setattr(climate_service, 'fetch_daily_climate', fake_fetch)
    url = (
        f'/api/climate/farm/{farm_id}?start_date=2024-01-01&end_date=2024-01-02'
        '&latitude=21.9588&longitude=96.0891'
    )
    first = client.get(url)
    second = client.get(url)

    assert first.status_code == 200
    assert first.get_json()['source'] == 'NASA POWER Daily API (AG)'
    assert [row['rainfall'] for row in first.get_json()['data']] == [1.25, 2.25]
    assert second.status_code == 200
    assert second.get_json()['cached'] is True
    assert len(calls) == 1


def test_history_aggregates_daily_rainfall_and_temperature(client, monkeypatch):
    from services import climate_service

    farm_id = create_farm(client)
    monkeypatch.setattr(climate_service, 'fetch_daily_climate', successful_nasa_response)
    response = client.get(
        f'/api/climate/history/{farm_id}?years=2023&latitude=21.9588&longitude=96.0891'
    )

    assert response.status_code == 200
    result = response.get_json()
    assert result['yearly_data']['2023']['rainfall'][0] == 3.5
    assert result['yearly_data']['2023']['temperature'][0] == 26.5
    assert result['last_observation'] == '2023-01-02'


def test_farm_coordinates_must_match_saved_farm(client, monkeypatch):
    from services import climate_service

    farm_id = create_farm(client)

    def unexpected_fetch(*args):
        pytest.fail('NASA should not be called for mismatched farm coordinates')

    monkeypatch.setattr(climate_service, 'fetch_daily_climate', unexpected_fetch)
    response = client.get(
        f'/api/climate/history/{farm_id}?years=2023&latitude=16.8&longitude=96.2'
    )

    assert response.status_code == 400
    assert 'do not match' in response.get_json()['error']


def test_nasa_failure_does_not_fall_back_to_sample_data(client, monkeypatch):
    from services import climate_service

    farm_id = create_farm(client)

    def failed_fetch(*args):
        return {'success': False, 'error': 'NASA POWER is unavailable.'}

    monkeypatch.setattr(climate_service, 'fetch_daily_climate', failed_fetch)
    response = client.get(
        f'/api/climate/farm/{farm_id}?start_date=2024-01-01&end_date=2024-01-02'
    )

    assert response.status_code == 502
    assert response.get_json()['error'] == 'NASA POWER is unavailable.'
    assert 'data' not in response.get_json()
