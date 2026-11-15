"""
Input validation utilities for FieldShift API.
"""

VALID_CROPS = [
    'Rice', 'Wheat', 'Maize', 'Mung Bean', 'Soybean', 'Sesame',
    'Groundnut', 'Sunflower', 'Cotton', 'Chickpea', 'Pigeon Pea',
]
VALID_SOIL_TYPES = [
    'Clay loam', 'Sandy loam', 'Silt loam', 'Clay', 'Sandy', 'Loam',
    'Alluvial', 'Laterite',
]
VALID_IRRIGATION = [
    'Canal irrigation', 'Rain-fed', 'Drip irrigation', 'Sprinkler',
    'Tube well', 'Pond/tank',
]
VALID_SEASONS = ['Monsoon', 'Winter', 'Summer']
VALID_WATER_AVAILABILITY = ['Low', 'Moderate', 'High']


def validate_farm_data(data):
    """
    Validate farm creation/update data.
    Returns (is_valid, errors) tuple.
    """
    errors = []

    if not isinstance(data, dict):
        return False, ['Request body is required.']

    # Required fields
    name = data.get('name', '').strip()
    if not name:
        errors.append('Farm name is required.')
    elif len(name) > 100:
        errors.append('Farm name must be 100 characters or fewer.')

    region = data.get('region', '').strip()
    if not region:
        errors.append('Region is required.')

    for location_field in ('district', 'township'):
        location_value = data.get(location_field, '')
        if location_value is not None and not isinstance(location_value, str):
            errors.append(f'{location_field.capitalize()} must be text.')
        elif isinstance(location_value, str) and len(location_value) > 100:
            errors.append(f'{location_field.capitalize()} must be 100 characters or fewer.')

    # Latitude and longitude
    lat = data.get('latitude')
    lon = data.get('longitude')
    if lat is None:
        errors.append('Latitude is required.')
    else:
        try:
            lat = float(lat)
            if lat < -90 or lat > 90:
                errors.append('Latitude must be between -90 and 90.')
        except (TypeError, ValueError):
            errors.append('Latitude must be a number.')

    if lon is None:
        errors.append('Longitude is required.')
    else:
        try:
            lon = float(lon)
            if lon < -180 or lon > 180:
                errors.append('Longitude must be between -180 and 180.')
        except (TypeError, ValueError):
            errors.append('Longitude must be a number.')

    # Area
    area = data.get('area')
    if area is not None:
        try:
            area = float(area)
            if area <= 0:
                errors.append('Farm area must be greater than zero.')
            elif area > 100000:
                errors.append('Farm area seems too large. Please check the value.')
        except (TypeError, ValueError):
            errors.append('Farm area must be a number.')

    # Soil type
    soil_type = data.get('soil_type', '')
    if soil_type and soil_type not in VALID_SOIL_TYPES:
        errors.append(f'Invalid soil type. Choose from: {", ".join(VALID_SOIL_TYPES)}')

    # Crops
    current_crop = data.get('current_crop', '')
    if current_crop and current_crop not in VALID_CROPS:
        errors.append(f'Invalid current crop. Choose from: {", ".join(VALID_CROPS)}')

    previous_crop = data.get('previous_crop', '')
    if previous_crop and previous_crop not in VALID_CROPS:
        errors.append(f'Invalid previous crop. Choose from: {", ".join(VALID_CROPS)}')

    # Irrigation
    irrigation = data.get('irrigation_method', '')
    if irrigation and irrigation not in VALID_IRRIGATION:
        errors.append(f'Invalid irrigation method. Choose from: {", ".join(VALID_IRRIGATION)}')

    planting_season = data.get('planting_season', '')
    if planting_season and planting_season not in VALID_SEASONS:
        errors.append(f'Invalid planting season. Choose from: {", ".join(VALID_SEASONS)}')

    return len(errors) == 0, errors


def validate_rotation_request(data):
    """
    Validate crop rotation generation request.
    Returns (is_valid, errors) tuple.
    """
    errors = []

    if not isinstance(data, dict):
        return False, ['Request body is required.']

    farm_id = data.get('farm_id')
    if farm_id is None:
        errors.append('farm_id is required.')
    else:
        try:
            parsed_farm_id = int(farm_id)
            if isinstance(farm_id, bool) or parsed_farm_id <= 0:
                errors.append('farm_id must be a positive integer.')
            elif isinstance(farm_id, float) and farm_id != parsed_farm_id:
                errors.append('farm_id must be an integer.')
        except (TypeError, ValueError):
            errors.append('farm_id must be an integer.')

    current_crop = data.get('current_crop', '')
    if not current_crop:
        errors.append('current_crop is required.')
    elif current_crop not in VALID_CROPS:
        errors.append(f'Invalid current_crop. Choose from: {", ".join(VALID_CROPS)}')

    previous_crop = data.get('previous_crop', '')
    if not previous_crop:
        errors.append('previous_crop is required.')
    elif previous_crop not in VALID_CROPS:
        errors.append(f'Invalid previous_crop. Choose from: {", ".join(VALID_CROPS)}')

    soil_type = data.get('soil_type', '')
    if not soil_type:
        errors.append('soil_type is required.')
    elif soil_type not in VALID_SOIL_TYPES:
        errors.append(f'Invalid soil_type. Choose from: {", ".join(VALID_SOIL_TYPES)}')

    water = data.get('water_availability', 'Moderate')
    if water not in VALID_WATER_AVAILABILITY:
        errors.append(f'Invalid water_availability. Choose from: {", ".join(VALID_WATER_AVAILABILITY)}')

    planning_period = data.get('planning_period', 3)
    try:
        pp = int(planning_period)
        if pp < 2 or pp > 6:
            errors.append('planning_period must be between 2 and 6 seasons.')
    except (TypeError, ValueError):
        errors.append('planning_period must be an integer.')

    irrigation = data.get('irrigation_method', 'Rain-fed')
    if irrigation not in VALID_IRRIGATION:
        errors.append(f'Invalid irrigation_method. Choose from: {", ".join(VALID_IRRIGATION)}')

    planting_season = data.get('planting_season', 'Monsoon')
    if planting_season not in VALID_SEASONS:
        errors.append(f'Invalid planting_season. Choose from: {", ".join(VALID_SEASONS)}')

    return len(errors) == 0, errors


def validate_coordinates(lat, lon):
    """Validate latitude and longitude values."""
    try:
        lat = float(lat)
        lon = float(lon)
        if lat < -90 or lat > 90:
            return False, 'Latitude must be between -90 and 90.'
        if lon < -180 or lon > 180:
            return False, 'Longitude must be between -180 and 180.'
        return True, None
    except (TypeError, ValueError):
        return False, 'Latitude and longitude must be numbers.'
