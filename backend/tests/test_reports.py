"""Focused tests for report data, farm scoping, and PDF downloads."""
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config


class ReportTestConfig(Config):
    TESTING = True
    DEBUG = False


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(
        ReportTestConfig, 'DATABASE_PATH', str(tmp_path / 'reports-test.db'),
        raising=False,
    )
    app = create_app(ReportTestConfig)
    return app.test_client()


def _create_farm(client, name='Report Test Farm'):
    response = client.post('/api/farms', json={
        'name': name,
        'country': 'Myanmar',
        'region': 'Shan',
        'district': 'Taunggyi',
        'township': 'Pindaya',
        'latitude': 20.95,
        'longitude': 96.67,
        'area': 3,
        'area_unit': 'acres',
        'soil_type': 'Silt loam',
        'current_crop': 'Maize',
        'previous_crop': 'Wheat',
        'irrigation_method': 'Canal irrigation',
        'planting_season': 'Monsoon',
    })
    assert response.status_code == 201
    return response.get_json()['farm']['id']


def _climate_result():
    return {
        'success': True,
        'summary': {
            'date_range': {'start': '2026-05-17', 'end': '2026-11-13'},
            'temperature': {'average': 22.7, 'unit': '°C'},
            'rainfall': {'total': 869.0, 'unit': 'mm'},
            'humidity': {'average': 81.3, 'unit': '%'},
            'soil_wetness': {'average': 0.626, 'unit': 'unitless fraction'},
        },
        'risks': [
            {'risk': 'Heat stress', 'level': 'Low', 'description': 'Temperature assessment.'},
        ],
        'source': 'NASA POWER Daily API (AG)',
        'period': {'start': '2026-05-17', 'end': '2026-11-13'},
        'retrieved_at': '2026-11-14T00:00:00Z',
        'last_observation': '2026-11-13',
    }


def _generate_plan(client, farm_id):
    response = client.post('/api/rotation/generate', json={
        'farm_id': farm_id,
        'current_crop': 'Maize',
        'previous_crop': 'Wheat',
        'soil_type': 'Silt loam',
        'water_availability': 'Moderate',
        'irrigation_method': 'Canal irrigation',
        'planting_season': 'Monsoon',
        'planning_period': 3,
    })
    assert response.status_code == 201
    return response.get_json()['plan']['id']


def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json()['status'] == 'ok'


def test_report_uses_saved_farm_nasa_summary_and_latest_plan(client, monkeypatch):
    from routes import report_routes

    monkeypatch.setattr(report_routes, 'get_climate_summary', lambda farm_id: _climate_result())
    farm_id = _create_farm(client)
    plan_id = _generate_plan(client, farm_id)

    response = client.post('/api/reports', json={'farm_id': farm_id})
    assert response.status_code == 201
    body = response.get_json()
    report = body['report']
    data = report['data']
    assert body['message'] == 'Report generated successfully.'
    assert report['farm_id'] == farm_id
    assert report['created_at']
    assert data['farm']['name'] == 'Report Test Farm'
    assert data['farm']['district'] == 'Taunggyi'
    assert data['farm']['township'] == 'Pindaya'
    assert data['farm']['current_crop'] == 'Maize'
    assert data['farm']['previous_crop'] == 'Wheat'
    assert data['climate']['source'] == 'NASA POWER Daily API (AG)'
    assert data['climate']['summary']['rainfall']['total'] == 869.0
    assert data['climate']['summary']['temperature']['average'] == 22.7
    assert data['climate']['summary']['soil_wetness']['average'] == 0.626
    assert data['rotation']['latest_plan']['id'] == plan_id
    assert data['rotation']['selected_plan'] is None
    assert 'not been marked as selected' in data['recommendations']['crop_rotation']['note']

    saved = client.get(f'/api/reports/{report["id"]}').get_json()['report']
    assert saved['report_data']['farm']['name'] == 'Report Test Farm'
    assert saved['selected_plan_id'] is None


def test_selected_plan_is_explicit_and_scoped_to_its_farm(client, monkeypatch):
    from routes import report_routes

    monkeypatch.setattr(report_routes, 'get_climate_summary', lambda farm_id: _climate_result())
    farm_id = _create_farm(client)
    other_farm_id = _create_farm(client, 'Another Farm')
    plan_id = _generate_plan(client, farm_id)

    wrong_farm = client.post('/api/reports', json={
        'farm_id': other_farm_id,
        'selected_plan_id': plan_id,
    })
    assert wrong_farm.status_code == 404

    selected = client.post('/api/reports', json={
        'farm_id': farm_id,
        'selected_plan_id': plan_id,
    })
    assert selected.status_code == 201
    assert selected.get_json()['report']['data']['rotation']['selected_plan']['id'] == plan_id

    following = client.post('/api/reports', json={'farm_id': farm_id})
    assert following.status_code == 201
    assert following.get_json()['report']['data']['rotation']['selected_plan']['id'] == plan_id


def test_report_rejects_missing_local_and_unknown_farm_ids(client):
    assert client.post('/api/reports', json={}).status_code == 400
    assert client.post('/api/reports', json={'farm_id': 'local_123'}).status_code == 400
    assert client.post('/api/reports', json={'farm_id': 1.5}).status_code == 400
    assert client.post('/api/reports', json={'farm_id': 9999}).status_code == 404


def test_nasa_failure_does_not_save_a_report(client, monkeypatch):
    from routes import report_routes

    farm_id = _create_farm(client)
    monkeypatch.setattr(
        report_routes,
        'get_climate_summary',
        lambda farm_id: {
            'success': False,
            'error': 'NASA POWER is unavailable.',
            'status_code': 502,
        },
    )
    response = client.post('/api/reports', json={'farm_id': farm_id})
    assert response.status_code == 502
    assert response.get_json()['error'] == 'NASA POWER is unavailable.'
    reports = client.get(f'/api/reports/farm/{farm_id}').get_json()
    assert reports['count'] == 0


def test_pdf_download_is_valid_and_contains_report_data(client, monkeypatch):
    from routes import report_routes

    monkeypatch.setattr(report_routes, 'get_climate_summary', lambda farm_id: _climate_result())
    farm_id = _create_farm(client)
    _generate_plan(client, farm_id)
    generated = client.post('/api/reports', json={'farm_id': farm_id}).get_json()
    report_id = generated['report']['id']

    response = client.get(f'/api/reports/{report_id}/pdf')
    assert response.status_code == 200
    assert response.mimetype == 'application/pdf'
    assert response.headers['Content-Disposition'].endswith('Report-Test-Farm-report.pdf"')
    assert response.data.startswith(b'%PDF-1.4')
    assert b'Report Test Farm - Farm Report' in response.data
    assert b'Observation period: 2026-05-17 to 2026-11-13' in response.data
    assert b'Total rainfall: 869.0 mm' in response.data
    assert b'%%EOF' in response.data
    xref_marker = response.data.rfind(b'startxref\n')
    xref_offset = int(response.data[xref_marker + len(b'startxref\n'):].splitlines()[0])
    assert response.data[xref_offset:xref_offset + 4] == b'xref'
    assert client.get('/api/reports/9999/pdf').status_code == 404
