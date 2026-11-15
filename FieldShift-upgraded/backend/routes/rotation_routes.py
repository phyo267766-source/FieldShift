"""
Crop rotation API routes.
Endpoints for generating, comparing, and managing rotation plans.
"""
from flask import Blueprint, request, jsonify
from services.rotation_service import (
    generate_rotation_plan,
    generate_comparison,
    get_plans_for_farm,
    get_plan_by_id,
    get_comparison_selection,
    select_plan,
    save_comparison_selection,
)
from services.notification_service import create_notification
from database.db import query_db
from utils.validators import validate_rotation_request

rotation_bp = Blueprint('rotation', __name__)


@rotation_bp.route('/api/rotation/generate', methods=['POST'])
def generate_plan():
    """
    Generate a crop rotation plan.

    Body JSON:
      farm_id, current_crop, previous_crop, soil_type,
      water_availability, irrigation_method, planting_season, planning_period
    """
    data = request.get_json()
    is_valid, errors = validate_rotation_request(data)

    if not is_valid:
        return jsonify({'error': 'Validation failed.', 'details': errors}), 400

    result = generate_rotation_plan(
        farm_id=int(data['farm_id']),
        current_crop=data['current_crop'],
        previous_crop=data['previous_crop'],
        soil_type=data['soil_type'],
        water_availability=data.get('water_availability', 'Moderate'),
        irrigation_method=data.get('irrigation_method', 'Rain-fed'),
        planting_season=data.get('planting_season', 'Monsoon'),
        planning_period=int(data.get('planning_period', 3)),
    )

    if not result['success']:
        return jsonify(result), 400

    farm = query_db('SELECT name FROM farms WHERE id = ?', (int(data['farm_id']),), one=True)
    farm_name = farm['name'] if farm else f'Farm {data["farm_id"]}'
    plan = result['plan']
    create_notification(
        'crop',
        'Rotation Plan Ready',
        f'A {plan["planning_period"]}-season rotation plan for {farm_name} has been generated.',
        f'rotation-plan:{plan["id"]}',
    )
    return jsonify(result), 201


@rotation_bp.route('/api/rotation/compare', methods=['POST'])
def compare_plans():
    """
    Generate 3 rotation plans for side-by-side comparison.

    Body JSON: same fields as /generate
    """
    data = request.get_json()
    is_valid, errors = validate_rotation_request(data)

    if not is_valid:
        return jsonify({'error': 'Validation failed.', 'details': errors}), 400

    result = generate_comparison(
        farm_id=int(data['farm_id']),
        current_crop=data['current_crop'],
        previous_crop=data['previous_crop'],
        soil_type=data['soil_type'],
        water_availability=data.get('water_availability', 'Moderate'),
        irrigation_method=data.get('irrigation_method', 'Rain-fed'),
        planting_season=data.get('planting_season', 'Monsoon'),
        planning_period=int(data.get('planning_period', 3)),
    )

    if not result['success']:
        return jsonify(result), 400

    return jsonify(result), 200


@rotation_bp.route('/api/rotation/selection', methods=['GET', 'POST'])
def comparison_selection():
    """Get or persist a manually selected plan for exact farm conditions."""
    data = request.args.to_dict() if request.method == 'GET' else request.get_json(silent=True)
    is_valid, errors = validate_rotation_request(data)
    if not is_valid:
        return jsonify({'error': 'Validation failed.', 'details': errors}), 400

    farm_id = int(data['farm_id'])
    farm = query_db('SELECT id FROM farms WHERE id = ?', (farm_id,), one=True)
    if not farm:
        return jsonify({'error': 'Farm not found.'}), 404

    conditions = {
        'current_crop': data['current_crop'],
        'previous_crop': data['previous_crop'],
        'soil_type': data['soil_type'],
        'water_availability': data.get('water_availability', 'Moderate'),
        'irrigation_method': data.get('irrigation_method', 'Rain-fed'),
        'planting_season': data.get('planting_season', 'Monsoon'),
        'planning_period': int(data.get('planning_period', 3)),
    }

    if request.method == 'GET':
        return jsonify({
            'success': True,
            'selection': get_comparison_selection(farm_id, conditions),
        }), 200

    sequence = data.get('sequence')
    selection_key = data.get('selection_key')
    if (
        not isinstance(sequence, list)
        or len(sequence) != conditions['planning_period']
        or any(not isinstance(crop, str) or not crop for crop in sequence)
        or not isinstance(selection_key, str)
    ):
        return jsonify({
            'error': 'A valid plan sequence and selection_key are required.'
        }), 400

    comparison = generate_comparison(
        farm_id=farm_id,
        current_crop=conditions['current_crop'],
        previous_crop=conditions['previous_crop'],
        soil_type=conditions['soil_type'],
        water_availability=conditions['water_availability'],
        irrigation_method=conditions['irrigation_method'],
        planting_season=conditions['planting_season'],
        planning_period=conditions['planning_period'],
    )
    matching_plan = next((
        plan for plan in comparison.get('plans', [])
        if plan['selection_key'] == selection_key and plan['sequence'] == sequence
    ), None)
    if not matching_plan:
        return jsonify({
            'error': 'The selected plan does not match the current comparison results.'
        }), 400

    selection = save_comparison_selection(farm_id, conditions, sequence)
    return jsonify({
        'success': True,
        'message': 'Plan selection saved successfully.',
        'selection': selection,
    }), 200


@rotation_bp.route('/api/rotation/farm/<int:farm_id>', methods=['GET'])
def farm_plans(farm_id):
    """Get all saved rotation plans for a farm."""
    result = get_plans_for_farm(farm_id)
    return jsonify(result), 200


@rotation_bp.route('/api/rotation/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Get a specific rotation plan by ID."""
    result = get_plan_by_id(plan_id)
    if not result['success']:
        return jsonify(result), 404
    return jsonify(result), 200


@rotation_bp.route('/api/rotation/<int:plan_id>/select', methods=['PUT'])
def select_rotation_plan(plan_id):
    """Mark a rotation plan as the selected/preferred plan."""
    result = select_plan(plan_id)
    if not result['success']:
        return jsonify(result), 404
    return jsonify(result), 200
