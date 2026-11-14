"""Persistence tests for farm district and township fields."""
import os
import sqlite3
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from config import Config


class TestConfig(Config):
    TESTING = True
    DEBUG = False


@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    config = type('FarmLocationTestConfig', (TestConfig,), {'DATABASE_PATH': db_path})
    app = create_app(config)
    yield app
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


def farm_payload(**overrides):
    return {
        'name': 'Shan Farm',
        'country': 'Myanmar',
        'region': 'Shan',
        'district': 'Taunggyi',
        'township': 'Nyaungshwe',
        'latitude': 20.67,
        'longitude': 96.93,
        'area': 4,
        'area_unit': 'acres',
        'soil_type': 'Clay loam',
        'current_crop': 'Rice',
        'previous_crop': 'Mung Bean',
        'irrigation_method': 'Rain-fed',
        'planting_season': 'Monsoon',
        **overrides,
    }


def test_district_and_township_survive_create_reload_and_update(client, app):
    created = client.post('/api/farms', json=farm_payload())
    assert created.status_code == 201
    farm_id = created.json['farm']['id']
    assert created.json['farm']['district'] == 'Taunggyi'
    assert created.json['farm']['township'] == 'Nyaungshwe'

    reloaded_app = create_app(type(
        'FarmReloadConfig', (TestConfig,), {'DATABASE_PATH': app.config['DATABASE_PATH']}
    ))
    reloaded = reloaded_app.test_client().get('/api/farms').json['farms'][0]
    assert reloaded['id'] == farm_id
    assert reloaded['region'] == 'Shan'
    assert reloaded['district'] == 'Taunggyi'
    assert reloaded['township'] == 'Nyaungshwe'
    assert reloaded['name'] == 'Shan Farm'
    assert reloaded['latitude'] == 20.67
    assert reloaded['longitude'] == 96.93

    updated = client.put(
        f'/api/farms/{farm_id}',
        json=farm_payload(district='Lashio', township='Hsipaw', area=8),
    )
    assert updated.status_code == 200
    assert updated.json['farm']['district'] == 'Lashio'
    assert updated.json['farm']['township'] == 'Hsipaw'
    assert updated.json['farm']['area'] == 8
    assert client.get(f'/api/farms/{farm_id}').json['farm']['district'] == 'Lashio'
    assert client.get(f'/api/farms/{farm_id}').json['farm']['township'] == 'Hsipaw'


def test_update_without_location_fields_preserves_existing_values(client):
    farm_id = client.post('/api/farms', json=farm_payload()).json['farm']['id']
    update_data = farm_payload()
    update_data.pop('district')
    update_data.pop('township')

    response = client.put(f'/api/farms/{farm_id}', json=update_data)
    assert response.status_code == 200
    assert response.json['farm']['district'] == 'Taunggyi'
    assert response.json['farm']['township'] == 'Nyaungshwe'

    cleared = client.put(
        f'/api/farms/{farm_id}',
        json=farm_payload(region='Kachin', district='', township=''),
    )
    assert cleared.status_code == 200
    assert cleared.json['farm']['region'] == 'Kachin'
    assert cleared.json['farm']['district'] == ''
    assert cleared.json['farm']['township'] == ''


def test_existing_database_is_migrated_without_losing_farms():
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    try:
        connection = sqlite3.connect(db_path)
        connection.execute('''
            CREATE TABLE farms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                country TEXT NOT NULL DEFAULT 'Myanmar',
                region TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                area REAL NOT NULL DEFAULT 1.0,
                area_unit TEXT NOT NULL DEFAULT 'hectares',
                soil_type TEXT NOT NULL DEFAULT 'Clay loam',
                current_crop TEXT NOT NULL DEFAULT 'Rice',
                previous_crop TEXT NOT NULL DEFAULT 'Rice',
                irrigation_method TEXT NOT NULL DEFAULT 'Rain-fed',
                planting_season TEXT NOT NULL DEFAULT 'Monsoon',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        ''')
        connection.execute(
            "INSERT INTO farms (name, region, latitude, longitude) VALUES ('Existing Farm', 'Shan', 20.0, 97.0)"
        )
        connection.commit()
        connection.close()

        config = type('FarmMigrationTestConfig', (TestConfig,), {'DATABASE_PATH': db_path})
        app = create_app(config)
        with app.test_client() as client:
            farm = client.get('/api/farms').json['farms'][0]
            assert farm['name'] == 'Existing Farm'
            assert farm['district'] == ''
            assert farm['township'] == ''
    finally:
        os.close(db_fd)
        os.unlink(db_path)
