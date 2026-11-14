"""
Crop Rotation Recommendation Engine — the main feature of FieldShift.

Generates crop rotation plans using transparent, rule-based logic.
Considers crop diversity, legume benefits, water requirements,
soil characteristics, climate suitability, and seasonal constraints.

All scores are illustrative and rule-based, not scientifically validated.
"""
import hashlib
import json
from datetime import datetime
from database.db import query_db, execute_db

# ── Crop knowledge base ────────────────────────────────────────────────────
# All values are relative/illustrative and used for scoring, not predictions.

CROPS = {
    'Rice': {
        'type': 'cereal',
        'water_need': 'high',
        'water_score': 9,
        'preferred_seasons': ['Monsoon'],
        'temp_range': (22, 35),
        'optimal_temp': (25, 32),
        'soil_preference': ['Clay loam', 'Clay', 'Silt loam'],
        'nitrogen_demand': 'high',
        'nitrogen_fix': False,
        'growth_months': 5,
        'icon': '🌾',
    },
    'Wheat': {
        'type': 'cereal',
        'water_need': 'moderate',
        'water_score': 5,
        'preferred_seasons': ['Winter'],
        'temp_range': (10, 30),
        'optimal_temp': (15, 25),
        'soil_preference': ['Loam', 'Clay loam', 'Silt loam'],
        'nitrogen_demand': 'moderate',
        'nitrogen_fix': False,
        'growth_months': 4,
        'icon': '🌾',
    },
    'Maize': {
        'type': 'cereal',
        'water_need': 'moderate',
        'water_score': 6,
        'preferred_seasons': ['Monsoon', 'Summer'],
        'temp_range': (18, 38),
        'optimal_temp': (24, 33),
        'soil_preference': ['Loam', 'Sandy loam', 'Clay loam'],
        'nitrogen_demand': 'high',
        'nitrogen_fix': False,
        'growth_months': 4,
        'icon': '🌽',
    },
    'Mung Bean': {
        'type': 'legume',
        'water_need': 'low',
        'water_score': 3,
        'preferred_seasons': ['Winter', 'Summer'],
        'temp_range': (20, 40),
        'optimal_temp': (25, 35),
        'soil_preference': ['Sandy loam', 'Loam', 'Clay loam'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': True,
        'growth_months': 3,
        'icon': '🌱',
    },
    'Soybean': {
        'type': 'legume',
        'water_need': 'moderate',
        'water_score': 5,
        'preferred_seasons': ['Monsoon', 'Summer'],
        'temp_range': (20, 35),
        'optimal_temp': (25, 30),
        'soil_preference': ['Loam', 'Clay loam', 'Silt loam'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': True,
        'growth_months': 4,
        'icon': '🫘',
    },
    'Sesame': {
        'type': 'oilseed',
        'water_need': 'low',
        'water_score': 2,
        'preferred_seasons': ['Summer', 'Winter'],
        'temp_range': (25, 40),
        'optimal_temp': (27, 35),
        'soil_preference': ['Sandy loam', 'Loam'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': False,
        'growth_months': 3,
        'icon': '🌿',
    },
    'Groundnut': {
        'type': 'legume',
        'water_need': 'moderate',
        'water_score': 4,
        'preferred_seasons': ['Monsoon', 'Summer'],
        'temp_range': (22, 38),
        'optimal_temp': (25, 33),
        'soil_preference': ['Sandy loam', 'Loam', 'Sandy'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': True,
        'growth_months': 4,
        'icon': '🥜',
    },
    'Sunflower': {
        'type': 'oilseed',
        'water_need': 'moderate',
        'water_score': 5,
        'preferred_seasons': ['Winter', 'Summer'],
        'temp_range': (18, 35),
        'optimal_temp': (22, 30),
        'soil_preference': ['Sandy loam', 'Loam', 'Clay loam'],
        'nitrogen_demand': 'moderate',
        'nitrogen_fix': False,
        'growth_months': 4,
        'icon': '🌻',
    },
    'Cotton': {
        'type': 'fiber',
        'water_need': 'high',
        'water_score': 8,
        'preferred_seasons': ['Monsoon', 'Summer'],
        'temp_range': (20, 38),
        'optimal_temp': (25, 35),
        'soil_preference': ['Clay loam', 'Sandy loam', 'Loam'],
        'nitrogen_demand': 'high',
        'nitrogen_fix': False,
        'growth_months': 6,
        'icon': '☁️',
    },
    'Chickpea': {
        'type': 'legume',
        'water_need': 'low',
        'water_score': 3,
        'preferred_seasons': ['Winter'],
        'temp_range': (10, 30),
        'optimal_temp': (15, 25),
        'soil_preference': ['Sandy loam', 'Loam', 'Clay loam'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': True,
        'growth_months': 4,
        'icon': '🫘',
    },
    'Pigeon Pea': {
        'type': 'legume',
        'water_need': 'moderate',
        'water_score': 5,
        'preferred_seasons': ['Monsoon', 'Summer'],
        'temp_range': (18, 38),
        'optimal_temp': (24, 32),
        'soil_preference': ['Sandy loam', 'Loam', 'Clay loam'],
        'nitrogen_demand': 'low',
        'nitrogen_fix': True,
        'growth_months': 6,
        'icon': '🌱',
    },
}

# Season definitions for Myanmar
SEASONS = {
    'Monsoon': {'months': 'May–Oct', 'start_month': 5, 'rainfall': 'high'},
    'Winter': {'months': 'Nov–Feb', 'start_month': 11, 'rainfall': 'low'},
    'Summer': {'months': 'Mar–May', 'start_month': 3, 'rainfall': 'low'},
}

WATER_LEVELS = {'Low': 1, 'Moderate': 2, 'High': 3}

def _selection_identity(farm_id, conditions, sequence=None):
    normalized = {
        'farm_id': int(farm_id),
        'current_crop': conditions['current_crop'],
        'previous_crop': conditions['previous_crop'],
        'soil_type': conditions['soil_type'],
        'water_availability': conditions.get('water_availability', 'Moderate'),
        'irrigation_method': conditions.get('irrigation_method', 'Rain-fed'),
        'planting_season': conditions.get('planting_season', 'Monsoon'),
        'planning_period': int(conditions.get('planning_period', 3)),
    }
    encoded_conditions = json.dumps(
        normalized, sort_keys=True, separators=(',', ':'), ensure_ascii=False
    )
    conditions_key = hashlib.sha256(encoded_conditions.encode('utf-8')).hexdigest()
    if sequence is None:
        return conditions_key, None, normalized

    encoded_plan = json.dumps(
        {'conditions_key': conditions_key, 'sequence': list(sequence)},
        sort_keys=True, separators=(',', ':'), ensure_ascii=False
    )
    selection_key = hashlib.sha256(encoded_plan.encode('utf-8')).hexdigest()
    return conditions_key, selection_key, normalized


def get_comparison_selection(farm_id, conditions):
    """Retrieve a saved user selection for this farm and exact comparison inputs."""
    conditions_key, _, normalized = _selection_identity(farm_id, conditions)
    selection = query_db(
        '''SELECT * FROM rotation_plan_selections
           WHERE farm_id = ? AND planning_period = ? AND conditions_key = ?''',
        (normalized['farm_id'], normalized['planning_period'], conditions_key),
        one=True,
    )
    if not selection:
        return None

    return {
        'farm_id': selection['farm_id'],
        'planning_period': selection['planning_period'],
        'conditions': json.loads(selection['conditions_json']),
        'selection_key': selection['selection_key'],
        'sequence': json.loads(selection['sequence_json']),
        'selected_at': selection['selected_at'],
    }


def save_comparison_selection(farm_id, conditions, sequence):
    """Persist a selected comparison sequence for its exact farm conditions."""
    conditions_key, selection_key, normalized = _selection_identity(
        farm_id, conditions, sequence
    )
    execute_db(
        '''INSERT INTO rotation_plan_selections
           (farm_id, planning_period, conditions_key, selection_key,
            conditions_json, sequence_json, selected_at)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(farm_id, planning_period, conditions_key)
           DO UPDATE SET
               selection_key = excluded.selection_key,
               conditions_json = excluded.conditions_json,
               sequence_json = excluded.sequence_json,
               selected_at = datetime('now')''',
        (
            normalized['farm_id'],
            normalized['planning_period'],
            conditions_key,
            selection_key,
            json.dumps(normalized, sort_keys=True, ensure_ascii=False),
            json.dumps(list(sequence), ensure_ascii=False),
        ),
    )
    return get_comparison_selection(farm_id, normalized)


def generate_rotation_plan(farm_id, current_crop, previous_crop, soil_type,
                           water_availability='Moderate', irrigation_method='Rain-fed',
                           planting_season='Monsoon', planning_period=3):
    """
    Generate a crop rotation plan for a farm.

    Args:
        farm_id: The farm ID
        current_crop: Currently growing crop
        previous_crop: Last season's crop
        soil_type: Farm soil type
        water_availability: 'Low', 'Moderate', or 'High'
        irrigation_method: Irrigation type
        planting_season: Starting season
        planning_period: Number of seasons (2-6)

    Returns:
        dict with recommended sequence, scores, explanation, and season details
    """
    # Validate inputs
    if current_crop not in CROPS:
        return {'success': False, 'error': f'Unknown crop: {current_crop}'}
    if previous_crop not in CROPS:
        return {'success': False, 'error': f'Unknown crop: {previous_crop}'}

    # Get farm info if available
    farm = query_db('SELECT * FROM farms WHERE id = ?', (farm_id,), one=True)

    # Score all possible sequences
    candidates = _generate_candidates(
        current_crop, previous_crop, soil_type,
        water_availability, irrigation_method,
        planting_season, planning_period
    )

    if not candidates:
        return {'success': False, 'error': 'Could not generate rotation candidates.'}

    # Sort by score, pick top 3
    candidates.sort(key=lambda c: c['total_score'], reverse=True)
    best = candidates[0]

    # Build season details for the best plan
    season_details = _build_season_details(
        best['sequence'], planting_season, planning_period
    )

    # Build explanation
    explanation = _explain_plan(
        best, current_crop, previous_crop, soil_type, water_availability
    )

    # Build benefits list
    benefits = _list_benefits(best['sequence'])

    # Save to database
    plan_id = execute_db(
        '''INSERT INTO rotation_plans
           (farm_id, current_crop, previous_crop, soil_type,
            water_availability, irrigation_method, planting_season,
            planning_period, recommended_sequence, suitability_score,
            explanation, season_details, benefits)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (
            farm_id, current_crop, previous_crop, soil_type,
            water_availability, irrigation_method, planting_season,
            planning_period,
            json.dumps(best['sequence']),
            best['total_score'],
            explanation,
            json.dumps(season_details),
            json.dumps(benefits),
        )
    )

    return {
        'success': True,
        'plan': {
            'id': plan_id,
            'farm_id': farm_id,
            'sequence': best['sequence'],
            'score': best['total_score'],
            'score_breakdown': best['breakdown'],
            'season_details': season_details,
            'explanation': explanation,
            'benefits': benefits,
            'planning_period': planning_period,
            'planting_season': planting_season,
        },
        'note': 'Scores are illustrative and based on rule-based logic. '
                'Consult local agricultural experts before making decisions.',
    }


def generate_comparison(farm_id, current_crop, previous_crop, soil_type,
                        water_availability='Moderate', irrigation_method='Rain-fed',
                        planting_season='Monsoon', planning_period=3):
    """
    Generate 3 different rotation plans for comparison.

    Returns:
        dict with three plans: traditional, diversified (recommended), alternative
    """
    if current_crop not in CROPS:
        return {'success': False, 'error': f'Unknown crop: {current_crop}'}

    candidates = _generate_candidates(
        current_crop, previous_crop, soil_type,
        water_availability, irrigation_method,
        planting_season, planning_period
    )

    if len(candidates) < 3:
        # Pad with monoculture plan
        mono = {
            'sequence': [current_crop] * planning_period,
            'total_score': 40,
            'breakdown': {
                'diversity': 0, 'soil_health': 30,
                'water': 50, 'climate': 50, 'legume_bonus': 0,
            },
        }
        candidates.append(mono)

    candidates.sort(key=lambda c: c['total_score'], reverse=True)

    # Pick three distinct plans
    plans = []
    seen_sequences = set()
    for c in candidates:
        seq_key = '→'.join(c['sequence'])
        if seq_key not in seen_sequences:
            seen_sequences.add(seq_key)
            plans.append(c)
        if len(plans) >= 3:
            break

    # Ensure we always have a monoculture plan for comparison
    mono_key = '→'.join([current_crop] * planning_period)
    has_mono = any('→'.join(p['sequence']) == mono_key for p in plans)
    if not has_mono and len(plans) >= 3:
        # Replace the worst with monoculture
        mono = _score_sequence(
            [current_crop] * planning_period, previous_crop,
            soil_type, water_availability, planting_season
        )
        plans[2] = mono

    # Build comparison output
    result_plans = []
    comparison_conditions = {
        'current_crop': current_crop,
        'previous_crop': previous_crop,
        'soil_type': soil_type,
        'water_availability': water_availability,
        'irrigation_method': irrigation_method,
        'planting_season': planting_season,
        'planning_period': planning_period,
    }
    for i, plan in enumerate(plans[:3]):
        is_best = (i == 0)
        season_details = _build_season_details(
            plan['sequence'], planting_season, planning_period
        )
        water_demand = _estimate_water_demand(plan['sequence'])
        crop_types = set(plan['sequence'])
        has_legume = any(CROPS[c]['nitrogen_fix'] for c in crop_types if c in CROPS)

        conditions_key, selection_key, _ = _selection_identity(
            farm_id, comparison_conditions, plan['sequence']
        )
        result_plans.append({
            'id': chr(65 + i),  # A, B, C
            'conditions_key': conditions_key,
            'selection_key': selection_key,
            'label': f'PLAN {chr(65 + i)}',
            'name': _plan_name(plan['sequence'], is_best),
            'sequence': plan['sequence'],
            'score': plan['total_score'],
            'recommended': is_best,
            'climate_score': plan['breakdown'].get('climate', 0),
            'water_demand': water_demand,
            'soil_health': 'Strong' if has_legume else ('Good' if len(crop_types) > 1 else 'Limited'),
            'crop_diversity': f'{len(crop_types)} crop{"s" if len(crop_types) > 1 else ""}',
            'sustainability_risk': 'Low' if plan['total_score'] >= 80 else ('Moderate' if plan['total_score'] >= 60 else 'High'),
            'season_details': season_details,
            'explanation': _explain_plan(plan, current_crop, previous_crop, soil_type, water_availability),
        })

    # Reorder: put recommended first? No — the spec says compare three.
    # But re-label: best score = recommended
    best_idx = 0
    for i, p in enumerate(result_plans):
        if p['score'] == max(rp['score'] for rp in result_plans):
            best_idx = i
            break

    for i, p in enumerate(result_plans):
        p['recommended'] = (i == best_idx)
        if i == best_idx:
            p['label'] = 'RECOMMENDED'

    return {
        'success': True,
        'plans': result_plans,
        'farm_id': farm_id,
        'note': 'Illustrative suitability scores based on rule-based logic. '
                'Not calibrated or guaranteed.',
    }


def get_plans_for_farm(farm_id):
    """Get all saved rotation plans for a farm."""
    plans = query_db(
        'SELECT * FROM rotation_plans WHERE farm_id = ? ORDER BY created_at DESC',
        (farm_id,)
    )
    for plan in plans:
        plan['recommended_sequence'] = json.loads(plan['recommended_sequence'])
        if plan.get('season_details'):
            plan['season_details'] = json.loads(plan['season_details'])
        if plan.get('benefits'):
            plan['benefits'] = json.loads(plan['benefits'])
    return {'success': True, 'plans': plans, 'count': len(plans)}


def get_plan_by_id(plan_id):
    """Get a single rotation plan by ID."""
    plan = query_db(
        'SELECT * FROM rotation_plans WHERE id = ?', (plan_id,), one=True
    )
    if not plan:
        return {'success': False, 'error': 'Rotation plan not found.'}

    plan['recommended_sequence'] = json.loads(plan['recommended_sequence'])
    if plan.get('season_details'):
        plan['season_details'] = json.loads(plan['season_details'])
    if plan.get('benefits'):
        plan['benefits'] = json.loads(plan['benefits'])

    return {'success': True, 'plan': plan}


def select_plan(plan_id):
    """Persist a saved rotation plan as the selection for its farm conditions."""
    plan = query_db(
        'SELECT * FROM rotation_plans WHERE id = ?', (plan_id,), one=True
    )
    if not plan:
        return {'success': False, 'error': 'Plan not found.'}

    sequence = json.loads(plan['recommended_sequence'])
    conditions = {
        'current_crop': plan['current_crop'],
        'previous_crop': plan['previous_crop'],
        'soil_type': plan['soil_type'],
        'water_availability': plan['water_availability'],
        'irrigation_method': plan['irrigation_method'],
        'planting_season': plan['planting_season'],
        'planning_period': plan['planning_period'],
    }
    selection = save_comparison_selection(plan['farm_id'], conditions, sequence)
    return {
        'success': True,
        'plan_id': plan_id,
        'message': 'Plan selection saved successfully.',
        'selection': selection,
    }


# ── Internal scoring functions ──────────────────────────────────────────────

def _generate_candidates(current_crop, previous_crop, soil_type,
                         water_availability, irrigation_method,
                         planting_season, planning_period):
    """Generate and score multiple rotation candidates."""
    all_crops = list(CROPS.keys())
    candidates = []

    # Strategy 1: Monoculture (for comparison baseline)
    mono_seq = [current_crop] * planning_period
    candidates.append(_score_sequence(
        mono_seq, previous_crop, soil_type, water_availability, planting_season
    ))

    # Strategy 2: Cereal-legume alternation
    legumes = [c for c in all_crops if CROPS[c]['nitrogen_fix']]
    for legume in legumes:
        seq = []
        for i in range(planning_period):
            seq.append(current_crop if i % 2 == 0 else legume)
        candidates.append(_score_sequence(
            seq, previous_crop, soil_type, water_availability, planting_season
        ))

    # Strategy 3: Full diversity rotation
    other_crops = [c for c in all_crops if c != current_crop]
    for i in range(min(len(other_crops), 4)):
        seq = [current_crop]
        for j in range(planning_period - 1):
            seq.append(other_crops[(i + j) % len(other_crops)])
        candidates.append(_score_sequence(
            seq, previous_crop, soil_type, water_availability, planting_season
        ))

    # Strategy 4: Water-optimized rotation
    low_water = sorted(all_crops, key=lambda c: CROPS[c]['water_score'])
    water_seq = [current_crop]
    for i in range(planning_period - 1):
        water_seq.append(low_water[i % len(low_water)])
    candidates.append(_score_sequence(
        water_seq, previous_crop, soil_type, water_availability, planting_season
    ))

    return candidates


def _score_sequence(sequence, previous_crop, soil_type,
                    water_availability, planting_season):
    """
    Score a crop rotation sequence on multiple criteria.
    Each criterion is scored 0-100, then weighted into a total.
    """
    # 1. Crop diversity score (20% weight)
    unique_crops = len(set(sequence))
    total_slots = len(sequence)
    diversity_score = min(100, int((unique_crops / total_slots) * 100) + (unique_crops - 1) * 15)

    # Penalty for repeating same crop consecutively
    repeat_penalty = 0
    for i in range(1, len(sequence)):
        if sequence[i] == sequence[i - 1]:
            repeat_penalty += 15
    diversity_score = max(0, diversity_score - repeat_penalty)

    # Also penalize if current == previous (from last real season)
    if sequence[0] == previous_crop:
        diversity_score = max(0, diversity_score - 10)

    # 2. Soil health score (25% weight)
    soil_score = 50  # Baseline
    has_legume = any(CROPS.get(c, {}).get('nitrogen_fix', False) for c in sequence)
    if has_legume:
        soil_score += 30
    # Bonus for soil-matched crops
    soil_matched = sum(1 for c in sequence if soil_type in CROPS.get(c, {}).get('soil_preference', []))
    soil_score += int((soil_matched / total_slots) * 20)
    soil_score = min(100, soil_score)

    # 3. Water efficiency score (20% weight)
    water_level = WATER_LEVELS.get(water_availability, 2)
    total_water_need = sum(CROPS.get(c, {}).get('water_score', 5) for c in sequence)
    avg_water_need = total_water_need / total_slots
    # Lower water need relative to availability = better score
    if water_level >= 3:
        water_score = 80  # High water = most crops are fine
    elif water_level == 2:
        water_score = max(30, 100 - int(avg_water_need * 8))
    else:
        water_score = max(20, 100 - int(avg_water_need * 12))

    # 4. Climate suitability score (25% weight)
    season_key = planting_season.split(' ')[0] if ' ' in planting_season else planting_season
    # Remove non-alpha chars
    season_key = ''.join(c for c in season_key if c.isalpha())
    climate_score = 50
    season_matched = 0
    for i, crop in enumerate(sequence):
        crop_info = CROPS.get(crop, {})
        # Rotate through seasons
        season_idx = i % 3
        current_season = list(SEASONS.keys())[season_idx]
        if i == 0:
            current_season = season_key if season_key in SEASONS else 'Monsoon'
        if current_season in crop_info.get('preferred_seasons', []):
            season_matched += 1
    climate_score = min(100, 40 + int((season_matched / total_slots) * 60))

    # 5. Legume rotation bonus (10% weight)
    legume_bonus = 0
    if has_legume:
        legume_count = sum(1 for c in sequence if CROPS.get(c, {}).get('nitrogen_fix', False))
        legume_bonus = min(100, legume_count * 40)
        # Extra bonus if legume follows a high-nitrogen-demand crop
        for i in range(1, len(sequence)):
            if (CROPS.get(sequence[i], {}).get('nitrogen_fix', False) and
                    CROPS.get(sequence[i - 1], {}).get('nitrogen_demand') == 'high'):
                legume_bonus = min(100, legume_bonus + 15)

    # Weighted total
    total = int(
        diversity_score * 0.20 +
        soil_score * 0.25 +
        water_score * 0.20 +
        climate_score * 0.25 +
        legume_bonus * 0.10
    )
    total = max(0, min(100, total))

    return {
        'sequence': sequence,
        'total_score': total,
        'breakdown': {
            'diversity': diversity_score,
            'soil_health': soil_score,
            'water_efficiency': water_score,
            'climate': climate_score,
            'legume_bonus': legume_bonus,
        },
    }


def _build_season_details(sequence, planting_season, planning_period):
    """Build detailed season-by-season info for a rotation plan."""
    season_key = planting_season.split(' ')[0] if ' ' in planting_season else planting_season
    season_key = ''.join(c for c in season_key if c.isalpha())
    if season_key not in SEASONS:
        season_key = 'Monsoon'

    season_order = list(SEASONS.keys())
    try:
        start_idx = season_order.index(season_key)
    except ValueError:
        start_idx = 0

    current_year = datetime.utcnow().year + 1
    details = []

    for i, crop in enumerate(sequence):
        season_name = season_order[(start_idx + i) % len(season_order)]
        season_info = SEASONS[season_name]
        crop_info = CROPS.get(crop, {})

        year_offset = (start_idx + i) // 3
        year = current_year + year_offset

        # Water demand description
        water_need = crop_info.get('water_need', 'moderate')
        water_desc = {
            'high': f'High > 1,200 mm',
            'moderate': f'Medium 600–1,200 mm',
            'low': f'Low < 600 mm',
        }.get(water_need, 'Medium')

        # Soil health benefit
        if crop_info.get('nitrogen_fix'):
            soil_benefit = 'Supports nitrogen cycling when residues are managed'
        elif crop_info.get('type') == 'cereal':
            soil_benefit = 'Maintains organic matter'
        else:
            soil_benefit = 'Adds crop diversity to the rotation'

        # Climate suitability
        is_season_match = season_name in crop_info.get('preferred_seasons', [])
        suitability = crop_info.get('water_score', 5) * 10
        if is_season_match:
            suitability = min(95, suitability + 20)
        else:
            suitability = max(40, suitability - 10)

        details.append({
            'season_number': i + 1,
            'season_label': f'SEASON {str(i + 1).zfill(2)}',
            'crop': crop,
            'period': f'{season_info["months"]} {year}',
            'season_name': season_name,
            'water_demand': water_desc,
            'soil_health': soil_benefit,
            'suitability': f'{suitability} / 100',
            'suitability_score': suitability,
            'icon': crop_info.get('icon', '🌿'),
        })

    return details


def _explain_plan(plan, current_crop, previous_crop, soil_type, water_availability):
    """Generate a human-readable explanation for a rotation plan."""
    sequence = plan['sequence']
    unique = set(sequence)
    has_legume = any(CROPS.get(c, {}).get('nitrogen_fix', False) for c in unique)

    parts = []
    if len(unique) == 1:
        parts.append(f'Continuous {sequence[0]} monoculture.')
        parts.append('Consider adding crop diversity to reduce pest pressure and improve soil health.')
    else:
        if has_legume:
            legume_names = [c for c in unique if CROPS.get(c, {}).get('nitrogen_fix', False)]
            parts.append(f'Introduces {"and ".join(legume_names)} as a legume break.')
            parts.append('This can support nitrogen cycling and reduce fertilizer dependency.')
        parts.append(f'Rotates {len(unique)} different crops across {len(sequence)} seasons.')

    if plan['total_score'] >= 80:
        parts.append('Overall suitability is high for the given conditions.')
    elif plan['total_score'] >= 60:
        parts.append('A balanced plan with room for further optimization.')
    else:
        parts.append('Consider adjusting inputs for a better-suited rotation.')

    return ' '.join(parts)


def _list_benefits(sequence):
    """List key benefits of a rotation sequence."""
    unique = set(sequence)
    benefits = []
    idx = 1

    if len(unique) > 1:
        benefits.append({
            'id': str(idx).zfill(2),
            'title': 'Crop diversity',
            'desc': 'Break repeated crop cycles and support a more natural growing system.',
        })
        idx += 1

    has_legume = any(CROPS.get(c, {}).get('nitrogen_fix', False) for c in unique)
    if has_legume:
        benefits.append({
            'id': str(idx).zfill(2),
            'title': 'Nitrogen management',
            'desc': 'Legume crops can support nitrogen cycling when residues are managed well.',
        })
        idx += 1

    if len(unique) > 1:
        benefits.append({
            'id': str(idx).zfill(2),
            'title': 'Soil protection',
            'desc': 'Different root systems help maintain soil structure and reduce erosion risk.',
        })
        idx += 1

    water_scores = [CROPS.get(c, {}).get('water_score', 5) for c in unique]
    if min(water_scores) < max(water_scores):
        benefits.append({
            'id': str(idx).zfill(2),
            'title': 'Water conservation',
            'desc': 'A lower water-demand crop in the rotation may reduce overall irrigation pressure.',
        })
        idx += 1

    return benefits


def _estimate_water_demand(sequence):
    """Estimate total water demand description for a sequence."""
    total_score = sum(CROPS.get(c, {}).get('water_score', 5) for c in sequence)
    avg = total_score / len(sequence)
    if avg >= 7:
        return f'High > {int(avg * 420)} mm'
    elif avg >= 4:
        return f'Medium < {int(avg * 420)} mm'
    else:
        return f'Low < {int(avg * 420)} mm'


def _plan_name(sequence, is_best):
    """Generate a human-readable name for a rotation plan."""
    unique = set(sequence)
    if len(unique) == 1:
        return 'Traditional Rotation'
    has_legume = any(CROPS.get(c, {}).get('nitrogen_fix', False) for c in unique)
    if has_legume and len(unique) == 2:
        return 'Diversified Rotation'
    if len(unique) >= 3:
        return 'Multi-Crop Rotation'
    return 'Alternative Rotation'
