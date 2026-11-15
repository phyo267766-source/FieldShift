"""
Farm management API routes.
RESTful endpoints for CRUD operations on farm profiles.
"""
from uuid import uuid4
from flask import Blueprint, request, jsonify
from database.db import query_db, execute_db
from services.notification_service import create_notification
from utils.validators import validate_farm_data

farm_bp = Blueprint('farms', __name__)


@farm_bp.route('/api/farms', methods=['GET'])
def get_farms():
    """Get all farms."""
    farms = query_db('SELECT * FROM farms ORDER BY updated_at DESC')
    return jsonify({'farms': farms, 'count': len(farms)}), 200


@farm_bp.route('/api/farms/<int:farm_id>', methods=['GET'])
def get_farm(farm_id):
    """Get a single farm by ID."""
    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    if not farm:
        return jsonify({'error': 'Farm not found.'}), 404
    return jsonify({'farm': farm}), 200


@farm_bp.route('/api/farms', methods=['POST'])
def create_farm():
    """Create a new farm profile."""
    data = request.get_json()
    is_valid, errors = validate_farm_data(data)

    if not is_valid:
        return jsonify({'error': 'Validation failed.', 'details': errors}), 400

    farm_id = execute_db(
        '''INSERT INTO farms
           (name, country, region, district, township, latitude, longitude, area, area_unit,
            soil_type, current_crop, previous_crop, irrigation_method, planting_season)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            data['name'].strip(),
            data.get('country', 'Myanmar'),
            data['region'].strip(),
            (data.get('district') or '').strip(),
            (data.get('township') or '').strip(),
            float(data['latitude']),
            float(data['longitude']),
            float(data.get('area', 1.0)),
            data.get('area_unit', 'hectares'),
            data.get('soil_type', 'Clay loam'),
            data.get('current_crop', 'Rice'),
            data.get('previous_crop', 'Rice'),
            data.get('irrigation_method', 'Rain-fed'),
            data.get('planting_season', 'Monsoon'),
        )
    )

    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    create_notification(
        'system',
        'Farm saved',
        f'{farm["name"]} was saved successfully.',
        f'farm-created:{farm_id}',
    )
    return jsonify({'message': 'Farm created successfully.', 'farm': farm}), 201


@farm_bp.route('/api/farms/<int:farm_id>', methods=['PUT'])
def update_farm(farm_id):
    """Update an existing farm profile."""
    existing = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    if not existing:
        return jsonify({'error': 'Farm not found.'}), 404

    data = request.get_json()
    is_valid, errors = validate_farm_data(data)

    if not is_valid:
        return jsonify({'error': 'Validation failed.', 'details': errors}), 400

    execute_db(
        '''UPDATE farms SET
           name = ?, country = ?, region = ?, district = ?, township = ?,
           latitude = ?, longitude = ?,
           area = ?, area_unit = ?, soil_type = ?, current_crop = ?,
           previous_crop = ?, irrigation_method = ?, planting_season = ?,
           updated_at = datetime('now')
           WHERE id = ?''',
        (
            data['name'].strip(),
            data.get('country', existing['country']),
            data['region'].strip(),
            (
                (data.get('district') or '').strip()
                if 'district' in data
                else (existing.get('district') or '')
            ),
            (
                (data.get('township') or '').strip()
                if 'township' in data
                else (existing.get('township') or '')
            ),
            float(data['latitude']),
            float(data['longitude']),
            float(data.get('area', existing['area'])),
            data.get('area_unit', existing['area_unit']),
            data.get('soil_type', existing['soil_type']),
            data.get('current_crop', existing['current_crop']),
            data.get('previous_crop', existing['previous_crop']),
            data.get('irrigation_method', existing['irrigation_method']),
            data.get('planting_season', existing['planting_season']),
            farm_id,
        )
    )

    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    create_notification(
        'system',
        'Farm saved',
        f'{farm["name"]} was saved successfully.',
        f'farm-updated:{farm_id}:{uuid4()}',
    )
    return jsonify({'message': 'Farm updated successfully.', 'farm': farm}), 200


@farm_bp.route('/api/farms/<int:farm_id>', methods=['DELETE'])
def delete_farm(farm_id):
    """Delete a farm profile."""
    existing = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    if not existing:
        return jsonify({'error': 'Farm not found.'}), 404

    execute_db('DELETE FROM farms WHERE id = ?', (farm_id,))
    return jsonify({'message': f'Farm "{existing["name"]}" deleted successfully.'}), 200
