"""
Reports API routes.
Endpoints for generating and retrieving farm reports.
"""
import json
import re
from flask import Blueprint, Response, jsonify, request
from database.db import query_db, execute_db
from services.climate_service import get_climate_summary
from services.report_pdf_service import create_report_pdf
from services.rotation_service import get_plans_for_farm

report_bp = Blueprint('reports', __name__)


def _positive_id(value):
    """Return a positive integer ID, rejecting local, fractional, and boolean IDs."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, str) and value.strip().isdigit():
        parsed = int(value.strip())
        return parsed if parsed > 0 else None
    return None


def _serialize_plan(plan):
    if not plan:
        return None
    return {
        'id': plan['id'],
        'farm_id': plan['farm_id'],
        'sequence': plan['recommended_sequence'],
        'score': plan['suitability_score'],
        'explanation': plan.get('explanation'),
        'season_details': plan.get('season_details') or [],
        'benefits': plan.get('benefits') or [],
        'planning_period': plan['planning_period'],
        'planting_season': plan['planting_season'],
        'created_at': plan.get('created_at'),
    }


@report_bp.route('/api/reports', methods=['POST'])
def create_report():
    """
    Generate a report using saved farm data, NASA POWER observations, and
    rotation plans belonging to that farm.

    Body JSON: farm_id (required), selected_plan_id (optional)
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'A JSON request body is required.'}), 400

    farm_id = _positive_id(data.get('farm_id'))
    if farm_id is None:
        return jsonify({'error': 'farm_id must be a positive saved farm ID.'}), 400

    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)
    if not farm:
        return jsonify({'error': 'Farm not found.'}), 404

    selected_plan_id = None
    if data.get('selected_plan_id') not in (None, ''):
        selected_plan_id = _positive_id(data['selected_plan_id'])
        if selected_plan_id is None:
            return jsonify({'error': 'selected_plan_id must be a positive saved plan ID.'}), 400
        selected_plan = query_db(
            'SELECT * FROM rotation_plans WHERE id = ? AND farm_id = ?',
            (selected_plan_id, farm_id), one=True
        )
        if not selected_plan:
            return jsonify({'error': 'Selected rotation plan was not found for this farm.'}), 404
        selected_plan['recommended_sequence'] = json.loads(selected_plan['recommended_sequence'])
        if selected_plan.get('season_details'):
            selected_plan['season_details'] = json.loads(selected_plan['season_details'])
        if selected_plan.get('benefits'):
            selected_plan['benefits'] = json.loads(selected_plan['benefits'])
    else:
        selected_plan = None
        saved_selection = query_db(
            '''SELECT p.* FROM reports r
               JOIN rotation_plans p
                 ON p.id = r.selected_plan_id AND p.farm_id = r.farm_id
               WHERE r.farm_id = ? AND r.selected_plan_id IS NOT NULL
               ORDER BY r.created_at DESC LIMIT 1''',
            (farm_id,), one=True
        )
        if saved_selection:
            selected_plan_id = saved_selection['id']
            selected_plan = saved_selection
            selected_plan['recommended_sequence'] = json.loads(selected_plan['recommended_sequence'])
            if selected_plan.get('season_details'):
                selected_plan['season_details'] = json.loads(selected_plan['season_details'])
            if selected_plan.get('benefits'):
                selected_plan['benefits'] = json.loads(selected_plan['benefits'])

    climate = get_climate_summary(farm_id)
    if not climate.get('success'):
        return jsonify({
            'error': climate.get('error', 'NASA POWER climate observations are unavailable.')
        }), climate.get('status_code', 502)

    saved_plans = get_plans_for_farm(farm_id)
    latest_plan = saved_plans['plans'][0] if saved_plans.get('plans') else None
    report_data = {
        'farm': {
            key: farm.get(key) for key in (
                'id', 'name', 'country', 'region', 'district', 'township',
                'latitude', 'longitude', 'area', 'area_unit', 'soil_type',
                'current_crop', 'previous_crop', 'irrigation_method',
                'planting_season',
            )
        },
        'climate': {
            'summary': climate.get('summary', {}),
            'risks': climate.get('risks', []),
            'source': climate.get('source'),
            'period': climate.get('period'),
            'retrieved_at': climate.get('retrieved_at'),
            'last_observation': climate.get('last_observation'),
        },
        'rotation': {
            'plans_count': saved_plans.get('count', 0),
            'latest_plan': _serialize_plan(latest_plan),
            'selected_plan': _serialize_plan(selected_plan),
        },
    }
    report_data['recommendations'] = _build_recommendations(report_data)

    report_id = execute_db(
        '''INSERT INTO reports (farm_id, selected_plan_id, report_type, report_data)
           VALUES (?, ?, ?, ?)''',
        (farm_id, selected_plan_id, 'farm_summary', json.dumps(report_data))
    )
    saved_report = query_db(
        'SELECT created_at FROM reports WHERE id = ?', (report_id,), one=True
    )

    return jsonify({
        'message': 'Report generated successfully.',
        'report': {
            'id': report_id,
            'farm_id': farm_id,
            'created_at': saved_report['created_at'],
            'data': report_data,
        },
    }), 201


@report_bp.route('/api/reports/farm/<int:farm_id>', methods=['GET'])
def farm_reports(farm_id):
    """Get all reports for a farm."""
    reports = query_db(
        'SELECT * FROM reports WHERE farm_id = ? ORDER BY created_at DESC',
        (farm_id,)
    )
    for report in reports:
        report['report_data'] = json.loads(report['report_data'])
    return jsonify({'reports': reports, 'count': len(reports)}), 200


@report_bp.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID."""
    report = query_db('SELECT * FROM reports WHERE id = ?', (report_id,), one=True)
    if not report:
        return jsonify({'error': 'Report not found.'}), 404
    report['report_data'] = json.loads(report['report_data'])
    return jsonify({'report': report}), 200


@report_bp.route('/api/reports/<int:report_id>/pdf', methods=['GET'])
def download_report_pdf(report_id):
    """Download a PDF for a previously generated report."""
    report = query_db('SELECT * FROM reports WHERE id = ?', (report_id,), one=True)
    if not report:
        return jsonify({'error': 'Report not found.'}), 404
    report_data = json.loads(report['report_data'])
    farm_name = report_data.get('farm', {}).get('name') or f'farm-{report["farm_id"]}'
    filename = re.sub(r'[^A-Za-z0-9._-]+', '-', farm_name).strip('-') or 'farm'
    return Response(
        create_report_pdf(report_data),
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}-report.pdf"'},
    )


def _build_recommendations(report_data):
    farm = report_data['farm']
    climate = report_data['climate']
    rotation = report_data['rotation']
    summary = climate.get('summary') or {}
    risks = climate.get('risks') or []
    selected_plan = rotation.get('selected_plan')
    latest_plan = rotation.get('latest_plan')

    rotation_plan = selected_plan or latest_plan
    if rotation_plan:
        recommendations = {
            'crop_rotation': {
                'title': 'Selected Crop Rotation Plan' if selected_plan else 'Latest Generated Crop Rotation Plan',
                'plan': ' → '.join(rotation_plan['sequence']),
                'note': (
                    'This is the plan explicitly included in this report.'
                    if selected_plan
                    else 'This is the latest saved plan and has not been marked as selected.'
                ),
            }
        }
    else:
        recommendations = {
            'crop_rotation': {
                'title': 'Crop Rotation Plan',
                'plan': 'No saved rotation plan is available.',
                'note': 'No plan has been selected for this report.',
            }
        }

    rainfall = summary.get('rainfall', {})
    if rainfall.get('total') is not None:
        period = summary.get('date_range') or {}
        period_text = f' ({period["start"]} to {period["end"]})' if period.get('start') and period.get('end') else ''
        recommendations['water_conservation'] = {
            'title': 'Observed Rainfall',
            'value': f'{rainfall["total"]} {rainfall.get("unit", "mm")}{period_text}',
            'note': 'Historical measurement from the climate observation period.',
        }

    if farm.get('soil_type'):
        recommendations['soil_management'] = {
            'title': 'Saved Soil Type',
            'value': farm['soil_type'],
        }

    if risks:
        recommendations['climate_risk'] = {
            'title': 'Climate Risk Assessment',
            'value': '; '.join(
                f'{risk["risk"]}: {risk["level"]}'
                for risk in risks if risk.get('risk') and risk.get('level')
            ) or 'No risk assessment details available.',
            'note': 'Assessment derived from the reported NASA POWER observations.',
        }

    return recommendations
