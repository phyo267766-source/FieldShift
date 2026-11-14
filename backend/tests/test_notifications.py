"""Tests for persisted, event-based notifications."""
import json
import os
import sys
import tempfile
from datetime import datetime

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config
from database.db import init_db
import routes.climate_routes as climate_routes


class TestConfig(Config):
    TESTING = True
    DEBUG = False


@pytest.fixture
def client():
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    test_config = type('NotificationTestConfig', (TestConfig,), {'DATABASE_PATH': db_path})
    app = create_app(test_config)
    with app.app_context():
        init_db()

    yield app.test_client()

    os.close(db_fd)
    os.unlink(db_path)


def create_farm(client):
    response = client.post('/api/farms', json={
        'name': 'Notification Farm',
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
    return json.loads(response.data)['farm']['id']


def test_farm_notifications_are_created_only_after_successful_saves(client):
    farm_id = create_farm(client)
    response = client.get('/api/notifications')
    result = json.loads(response.data)
    assert response.status_code == 200
    assert result['unread_count'] == 1
    assert result['notifications'][0]['title'] == 'Farm saved'
    assert datetime.fromisoformat(result['notifications'][0]['time'].replace('Z', '+00:00')).tzinfo

    failed_save = client.post('/api/farms', json={'name': ''})
    assert failed_save.status_code == 400
    assert len(json.loads(client.get('/api/notifications').data)['notifications']) == 1

    update_response = client.put(f'/api/farms/{farm_id}', json={
        'name': 'Updated Notification Farm',
        'country': 'Myanmar',
        'region': 'Mandalay',
        'latitude': 21.9588,
        'longitude': 96.0891,
    })
    assert update_response.status_code == 200
    assert len(json.loads(client.get('/api/notifications').data)['notifications']) == 2


def test_rotation_notification_requires_successful_generation(client):
    farm_id = create_farm(client)
    payload = {
        'farm_id': farm_id,
        'current_crop': 'Rice',
        'previous_crop': 'Mung Bean',
        'soil_type': 'Clay loam',
        'water_availability': 'Moderate',
        'irrigation_method': 'Rain-fed',
        'planting_season': 'Monsoon',
        'planning_period': 3,
    }

    invalid = client.post('/api/rotation/generate', json={**payload, 'current_crop': 'Invalid'})
    assert invalid.status_code == 400
    before = len(json.loads(client.get('/api/notifications').data)['notifications'])

    response = client.post('/api/rotation/generate', json=payload)
    assert response.status_code == 201
    plan = json.loads(response.data)['plan']
    notifications = json.loads(client.get('/api/notifications').data)['notifications']
    rotation_notifications = [n for n in notifications if n['category'] == 'crop']
    assert len(notifications) == before + 1
    assert len(rotation_notifications) == 1
    assert f'{plan["planning_period"]}-season' in rotation_notifications[0]['message']


def test_climate_notification_requires_fresh_successful_data(client, monkeypatch):
    farm_id = create_farm(client)
    successful_result = {
        'success': True,
        'cached': False,
        'farm': {'id': farm_id, 'name': 'Notification Farm'},
        'last_observation': '2025-01-31',
        'data': [{'date': '2025-01-31', 'rainfall': 2.0}],
    }
    monkeypatch.setattr(
        climate_routes, 'get_climate_for_farm', lambda *args, **kwargs: successful_result
    )

    response = client.get(f'/api/climate/farm/{farm_id}')
    assert response.status_code == 200
    notifications = json.loads(client.get('/api/notifications').data)['notifications']
    climate_notifications = [n for n in notifications if n['category'] == 'climate']
    assert len(climate_notifications) == 1
    assert 'NASA POWER' in climate_notifications[0]['message']

    client.get(f'/api/climate/farm/{farm_id}')
    assert len([
        n for n in json.loads(client.get('/api/notifications').data)['notifications']
        if n['category'] == 'climate'
    ]) == 1

    monkeypatch.setattr(
        climate_routes,
        'get_climate_for_farm',
        lambda *args, **kwargs: {**successful_result, 'cached': True},
    )
    client.get(f'/api/climate/farm/{farm_id}')
    assert len([
        n for n in json.loads(client.get('/api/notifications').data)['notifications']
        if n['category'] == 'climate'
    ]) == 1

    monkeypatch.setattr(
        climate_routes,
        'get_climate_for_farm',
        lambda *args, **kwargs: {'success': False, 'error': 'Unavailable', 'status_code': 502},
    )
    failed = client.get(f'/api/climate/farm/{farm_id}')
    assert failed.status_code == 502
    assert len(json.loads(client.get('/api/notifications').data)['notifications']) == len(notifications)


def test_notification_read_and_dismiss_actions_persist(client):
    create_farm(client)
    notification = json.loads(client.get('/api/notifications').data)['notifications'][0]
    notification_id = notification['id']

    mark_response = client.patch(f'/api/notifications/{notification_id}/read')
    assert mark_response.status_code == 200
    assert json.loads(client.get('/api/notifications').data)['unread_count'] == 0

    create_farm(client)
    all_read = client.put('/api/notifications/read')
    assert all_read.status_code == 200
    assert json.loads(all_read.data)['unread_count'] == 0

    dismissed = client.delete(f'/api/notifications/{notification_id}')
    assert dismissed.status_code == 200
    remaining = json.loads(client.get('/api/notifications').data)['notifications']
    assert all(item['id'] != notification_id for item in remaining)
