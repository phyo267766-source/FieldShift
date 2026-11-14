"""Persistence tests for manually selected comparison plans."""
import json
import os
import sqlite3
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config


class SelectionTestConfig(Config):
    TESTING = True
    DEBUG = False


@pytest.fixture
def selection_client(tmp_path, monkeypatch):
    db_path = tmp_path / 'rotation-selection.db'
    monkeypatch.setattr(SelectionTestConfig, 'DATABASE_PATH', str(db_path))
    app = create_app(SelectionTestConfig)
    with app.test_client() as client:
        yield client, db_path


def _create_farm(client, name='Selection Farm'):
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


def _conditions(farm_id, planning_period=3):
    return {
        'farm_id': farm_id,
        'current_crop': 'Maize',
        'previous_crop': 'Wheat',
        'soil_type': 'Silt loam',
        'water_availability': 'Moderate',
        'irrigation_method': 'Canal irrigation',
        'planting_season': 'Monsoon',
        'planning_period': planning_period,
    }


def test_comparison_selection_persists_by_farm_period_and_conditions(selection_client):
    client, db_path = selection_client
    farm_id = _create_farm(client)
    other_farm_id = _create_farm(client, 'Other Selection Farm')
    conditions = _conditions(farm_id)

    comparison_response = client.post('/api/rotation/compare', json=conditions)
    assert comparison_response.status_code == 200
    plans = comparison_response.get_json()['plans']
    selected_plan = plans[1]
    assert selected_plan['id'] == 'B'
    assert selected_plan['selection_key']

    save_response = client.post('/api/rotation/selection', json={
        **conditions,
        'sequence': selected_plan['sequence'],
        'selection_key': selected_plan['selection_key'],
    })
    assert save_response.status_code == 200
    saved = save_response.get_json()
    assert saved['success'] is True
    assert saved['message'] == 'Plan selection saved successfully.'
    assert saved['selection']['farm_id'] == farm_id
    assert saved['selection']['planning_period'] == 3
    assert saved['selection']['selection_key'] == selected_plan['selection_key']
    assert saved['selection']['sequence'] == selected_plan['sequence']

    with sqlite3.connect(db_path) as connection:
        rows = connection.execute(
            '''SELECT farm_id, planning_period, selection_key, sequence_json
               FROM rotation_plan_selections'''
        ).fetchall()
    assert len(rows) == 1
    assert rows[0][0] == farm_id
    assert rows[0][1] == 3
    assert rows[0][2] == selected_plan['selection_key']
    assert json.loads(rows[0][3]) == selected_plan['sequence']

    get_response = client.get('/api/rotation/selection', query_string=conditions)
    assert get_response.status_code == 200
    assert get_response.get_json()['selection']['selection_key'] == selected_plan['selection_key']
    assert get_response.get_json()['selection']['sequence'] == selected_plan['sequence']

    changed_period = client.get(
        '/api/rotation/selection',
        query_string=_conditions(farm_id, planning_period=2),
    )
    assert changed_period.status_code == 200
    assert changed_period.get_json()['selection'] is None

    changed_condition = {**conditions, 'water_availability': 'High'}
    assert client.get(
        '/api/rotation/selection', query_string=changed_condition
    ).get_json()['selection'] is None

    other_farm = {**conditions, 'farm_id': other_farm_id}
    assert client.get(
        '/api/rotation/selection', query_string=other_farm
    ).get_json()['selection'] is None

    select_plan_c = plans[2]
    update_response = client.post('/api/rotation/selection', json={
        **conditions,
        'sequence': select_plan_c['sequence'],
        'selection_key': select_plan_c['selection_key'],
    })
    assert update_response.status_code == 200
    assert update_response.get_json()['selection']['selection_key'] == select_plan_c['selection_key']
    with sqlite3.connect(db_path) as connection:
        assert connection.execute(
            'SELECT COUNT(*) FROM rotation_plan_selections'
        ).fetchone()[0] == 1


def test_comparison_selection_rejects_unknown_farms_and_forged_plans(selection_client):
    client, _ = selection_client
    farm_id = _create_farm(client)
    conditions = _conditions(farm_id)
    plans = client.post('/api/rotation/compare', json=conditions).get_json()['plans']
    plan = plans[1]

    invalid_farm = client.post('/api/rotation/selection', json={
        **conditions,
        'farm_id': 9999,
        'sequence': plan['sequence'],
        'selection_key': plan['selection_key'],
    })
    assert invalid_farm.status_code == 404

    forged = client.post('/api/rotation/selection', json={
        **conditions,
        'sequence': ['Rice', 'Rice', 'Rice'],
        'selection_key': plan['selection_key'],
    })
    assert forged.status_code == 400
    assert client.get(
        '/api/rotation/selection', query_string=conditions
    ).get_json()['selection'] is None
