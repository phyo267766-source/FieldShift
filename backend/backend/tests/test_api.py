"""
FieldShift Backend – API Tests
Run with: pytest backend/tests/test_api.py -v
"""
import json
import os
import sys
import tempfile
import pytest

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config
from database.db import init_db


class TestConfig(Config):
    """Test configuration using a temporary database."""
    TESTING = True
    DEBUG = False


@pytest.fixture
def app(monkeypatch):
    """Create application instance for testing with a temp database."""
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    monkeypatch.setattr(TestConfig, 'DATABASE_PATH', db_path)

    app = create_app(TestConfig)

    with app.app_context():
        init_db()

    yield app

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Test client for making requests."""
    return app.test_client()


# ──────────────────────────────────────────────
#  Health check
# ──────────────────────────────────────────────

class TestHealthCheck:
    def test_api_root(self, client):
        res = client.get('/api')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['status'] == 'running'
        assert 'FieldShift' in data['service']

    def test_health_endpoint(self, client):
        res = client.get('/api/health')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['status'] == 'healthy'


# ──────────────────────────────────────────────
#  Farm CRUD
# ──────────────────────────────────────────────

class TestFarmAPI:
    SAMPLE_FARM = {
        'name': 'Test Farm',
        'country': 'Myanmar',
        'region': 'Mandalay',
        'latitude': 21.9588,
        'longitude': 96.0891,
        'area': 5.0,
        'soil_type': 'Clay loam',
        'current_crop': 'Rice',
        'previous_crop': 'Mung Bean',
        'irrigation_method': 'Canal irrigation',
        'planting_season': 'Monsoon',
    }

    def test_create_farm(self, client):
        res = client.post('/api/farms', json=self.SAMPLE_FARM)
        assert res.status_code == 201
        data = json.loads(res.data)
        assert data['data']['name'] == 'Test Farm'
        assert data['data']['latitude'] == 21.9588
        assert 'id' in data['data']

    def test_list_farms_empty(self, client):
        res = client.get('/api/farms')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['data'] == []

    def test_list_farms_after_create(self, client):
        client.post('/api/farms', json=self.SAMPLE_FARM)
        res = client.get('/api/farms')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert len(data['data']) == 1

    def test_get_farm_by_id(self, client):
        create_res = client.post('/api/farms', json=self.SAMPLE_FARM)
        farm_id = json.loads(create_res.data)['data']['id']

        res = client.get(f'/api/farms/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['data']['name'] == 'Test Farm'
        assert data['data']['region'] == 'Mandalay'

    def test_get_farm_not_found(self, client):
        res = client.get('/api/farms/9999')
        assert res.status_code == 404

    def test_update_farm(self, client):
        create_res = client.post('/api/farms', json=self.SAMPLE_FARM)
        farm_id = json.loads(create_res.data)['data']['id']

        updated = {**self.SAMPLE_FARM, 'name': 'Updated Farm', 'area': 10.0}
        res = client.put(f'/api/farms/{farm_id}', json=updated)
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['data']['name'] == 'Updated Farm'
        assert data['data']['area'] == 10.0

    def test_delete_farm(self, client):
        create_res = client.post('/api/farms', json=self.SAMPLE_FARM)
        farm_id = json.loads(create_res.data)['data']['id']

        res = client.delete(f'/api/farms/{farm_id}')
        assert res.status_code == 200

        # Verify deleted
        res = client.get(f'/api/farms/{farm_id}')
        assert res.status_code == 404

    def test_create_farm_missing_name(self, client):
        bad_farm = {**self.SAMPLE_FARM}
        del bad_farm['name']
        res = client.post('/api/farms', json=bad_farm)
        assert res.status_code == 400

    def test_create_farm_invalid_latitude(self, client):
        bad_farm = {**self.SAMPLE_FARM, 'latitude': 200}
        res = client.post('/api/farms', json=bad_farm)
        assert res.status_code == 400

    def test_create_farm_invalid_soil_type(self, client):
        bad_farm = {**self.SAMPLE_FARM, 'soil_type': 'Martian Dust'}
        res = client.post('/api/farms', json=bad_farm)
        assert res.status_code == 400


# ──────────────────────────────────────────────
#  Climate API (demo mode – no NASA access)
# ──────────────────────────────────────────────

class TestClimateAPI:
    def _create_farm(self, client):
        res = client.post('/api/farms', json=TestFarmAPI.SAMPLE_FARM)
        return json.loads(res.data)['data']['id']

    def test_climate_for_farm(self, client):
        farm_id = self._create_farm(client)
        res = client.get(f'/api/climate/farm/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        # Should return data (demo or real)
        assert 'data' in data

    def test_climate_summary(self, client):
        farm_id = self._create_farm(client)
        res = client.get(f'/api/climate/summary/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'data' in data

    def test_climate_history(self, client):
        farm_id = self._create_farm(client)
        res = client.get(f'/api/climate/history/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'data' in data

    def test_climate_by_coordinates(self, client):
        res = client.get('/api/climate/coordinates?lat=16.8&lon=96.2')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'data' in data

    def test_climate_coordinates_missing_params(self, client):
        res = client.get('/api/climate/coordinates')
        assert res.status_code == 400

    def test_climate_farm_not_found(self, client):
        res = client.get('/api/climate/farm/9999')
        assert res.status_code == 404


# ──────────────────────────────────────────────
#  Rotation API
# ──────────────────────────────────────────────

class TestRotationAPI:
    def _create_farm(self, client):
        res = client.post('/api/farms', json=TestFarmAPI.SAMPLE_FARM)
        return json.loads(res.data)['data']['id']

    def test_generate_rotation(self, client):
        farm_id = self._create_farm(client)
        res = client.post('/api/rotation/generate', json={
            'farm_id': farm_id,
            'current_crop': 'Rice',
            'previous_crop': 'Rice',
            'num_seasons': 3,
            'season': 'Monsoon',
            'soil_type': 'Clay loam',
            'water_availability': 'Moderate',
        })
        assert res.status_code == 201
        data = json.loads(res.data)
        assert 'data' in data
        assert 'sequence' in data['data']
        assert len(data['data']['sequence']) == 3
        assert 'score' in data['data']

    def test_generate_rotation_different_inputs(self, client):
        """Verify that different inputs produce different plans (not hardcoded)."""
        farm_id = self._create_farm(client)

        res1 = client.post('/api/rotation/generate', json={
            'farm_id': farm_id,
            'current_crop': 'Rice',
            'previous_crop': 'Rice',
            'num_seasons': 3,
            'season': 'Monsoon',
            'soil_type': 'Clay loam',
            'water_availability': 'High',
        })

        res2 = client.post('/api/rotation/generate', json={
            'farm_id': farm_id,
            'current_crop': 'Wheat',
            'previous_crop': 'Maize',
            'num_seasons': 3,
            'season': 'Winter',
            'soil_type': 'Sandy loam',
            'water_availability': 'Low',
        })

        plan1 = json.loads(res1.data)['data']
        plan2 = json.loads(res2.data)['data']

        # At least one of sequence or score should differ
        assert (plan1['sequence'] != plan2['sequence']) or (plan1['score'] != plan2['score']), \
            'Plans should differ for different inputs'

    def test_compare_plans(self, client):
        farm_id = self._create_farm(client)
        res = client.post('/api/rotation/compare', json={
            'farm_id': farm_id,
            'current_crop': 'Rice',
            'previous_crop': 'Rice',
            'num_seasons': 3,
            'season': 'Monsoon',
            'soil_type': 'Clay loam',
            'water_availability': 'Moderate',
        })
        assert res.status_code == 200
        data = json.loads(res.data)
        assert 'data' in data
        plans = data['data']['plans']
        assert len(plans) == 3

    def test_get_plans_for_farm(self, client):
        farm_id = self._create_farm(client)
        # Generate a plan first
        client.post('/api/rotation/generate', json={
            'farm_id': farm_id,
            'current_crop': 'Rice',
            'previous_crop': 'Rice',
            'num_seasons': 3,
            'season': 'Monsoon',
            'soil_type': 'Clay loam',
            'water_availability': 'Moderate',
        })

        res = client.get(f'/api/rotation/farm/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert len(data['data']) >= 1

    def test_generate_rotation_missing_fields(self, client):
        res = client.post('/api/rotation/generate', json={
            'current_crop': 'Rice',
        })
        assert res.status_code == 400


# ──────────────────────────────────────────────
#  Reports API
# ──────────────────────────────────────────────

class TestReportAPI:
    def _create_farm(self, client):
        res = client.post('/api/farms', json=TestFarmAPI.SAMPLE_FARM)
        return json.loads(res.data)['farm']['id']

    def _mock_climate(self, monkeypatch):
        from routes import report_routes

        monkeypatch.setattr(report_routes, 'get_climate_summary', lambda farm_id: {
            'success': True,
            'summary': {
                'date_range': {'start': '2026-05-17', 'end': '2026-11-13'},
                'temperature': {'average': 22.7, 'unit': '°C'},
                'rainfall': {'total': 869.0, 'unit': 'mm'},
            },
            'risks': [],
            'source': 'NASA POWER Daily API (AG)',
            'period': {'start': '2026-05-17', 'end': '2026-11-13'},
        })

    def test_generate_report(self, client, monkeypatch):
        self._mock_climate(monkeypatch)
        farm_id = self._create_farm(client)
        res = client.post('/api/reports', json={'farm_id': farm_id})
        assert res.status_code == 201
        data = json.loads(res.data)
        assert data['message'] == 'Report generated successfully.'
        assert data['report']['farm_id'] == farm_id
        assert data['report']['data']['farm']['name'] == TestFarmAPI.SAMPLE_FARM['name']
        assert data['report']['data']['climate']['source'] == 'NASA POWER Daily API (AG)'

    def test_get_reports_for_farm(self, client, monkeypatch):
        self._mock_climate(monkeypatch)
        farm_id = self._create_farm(client)
        client.post('/api/reports', json={'farm_id': farm_id})

        res = client.get(f'/api/reports/farm/{farm_id}')
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data['count'] == 1
        assert data['reports'][0]['report_data']['farm']['name'] == TestFarmAPI.SAMPLE_FARM['name']

    def test_generate_report_farm_not_found(self, client):
        res = client.post('/api/reports', json={'farm_id': 9999})
        assert res.status_code == 404


# ──────────────────────────────────────────────
#  Validators
# ──────────────────────────────────────────────

class TestValidators:
    def test_validate_coordinates_valid(self):
        from utils.validators import validate_coordinates
        errors = validate_coordinates(16.8, 96.2)
        assert errors == []

    def test_validate_coordinates_invalid_lat(self):
        from utils.validators import validate_coordinates
        errors = validate_coordinates(200, 96.2)
        assert len(errors) > 0

    def test_validate_coordinates_invalid_lon(self):
        from utils.validators import validate_coordinates
        errors = validate_coordinates(16.8, 400)
        assert len(errors) > 0

    def test_validate_farm_data_valid(self):
        from utils.validators import validate_farm_data
        errors = validate_farm_data(TestFarmAPI.SAMPLE_FARM)
        assert errors == []

    def test_validate_farm_data_missing_name(self):
        from utils.validators import validate_farm_data
        bad = {**TestFarmAPI.SAMPLE_FARM}
        del bad['name']
        errors = validate_farm_data(bad)
        assert len(errors) > 0


# ──────────────────────────────────────────────
#  Error handlers
# ──────────────────────────────────────────────

class TestErrorHandlers:
    def test_404_handler(self, client):
        res = client.get('/api/nonexistent')
        assert res.status_code == 404
        data = json.loads(res.data)
        assert 'error' in data

    def test_405_handler(self, client):
        res = client.patch('/api/farms')
        assert res.status_code == 405
        data = json.loads(res.data)
        assert 'error' in data
