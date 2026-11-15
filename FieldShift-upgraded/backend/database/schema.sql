-- FieldShift Database Schema
-- SQLite database for farm, climate, rotation, and report data

CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Myanmar',
    region TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT '',
    township TEXT NOT NULL DEFAULT '',
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
);

CREATE TABLE IF NOT EXISTS climate_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    observation_date TEXT NOT NULL,
    temperature REAL,
    rainfall REAL,
    solar_radiation REAL,
    humidity REAL,
    wind_speed REAL,
    data_source TEXT NOT NULL DEFAULT 'NASA POWER',
    retrieved_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS climate_observation_cache (
    farm_id INTEGER NOT NULL,
    observation_date TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    observation_data TEXT NOT NULL,
    retrieved_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (farm_id, observation_date),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rotation_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    current_crop TEXT NOT NULL,
    previous_crop TEXT NOT NULL,
    soil_type TEXT NOT NULL,
    water_availability TEXT NOT NULL DEFAULT 'Moderate',
    irrigation_method TEXT NOT NULL DEFAULT 'Rain-fed',
    planting_season TEXT NOT NULL DEFAULT 'Monsoon',
    planning_period INTEGER NOT NULL DEFAULT 3,
    recommended_sequence TEXT NOT NULL,
    suitability_score REAL NOT NULL DEFAULT 0,
    explanation TEXT,
    season_details TEXT,
    benefits TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rotation_plan_selections (
    farm_id INTEGER NOT NULL,
    planning_period INTEGER NOT NULL,
    conditions_key TEXT NOT NULL,
    selection_key TEXT NOT NULL,
    conditions_json TEXT NOT NULL,
    sequence_json TEXT NOT NULL,
    selected_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (farm_id, planning_period, conditions_key),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    selected_plan_id INTEGER,
    report_type TEXT NOT NULL DEFAULT 'farm_summary',
    report_data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_plan_id) REFERENCES rotation_plans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0
);

-- Index for faster climate data lookups
CREATE INDEX IF NOT EXISTS idx_climate_farm_date
    ON climate_data(farm_id, observation_date);

CREATE INDEX IF NOT EXISTS idx_climate_cache_farm_date
    ON climate_observation_cache(farm_id, observation_date);

-- Index for rotation plans by farm
CREATE INDEX IF NOT EXISTS idx_rotation_farm
    ON rotation_plans(farm_id);

CREATE INDEX IF NOT EXISTS idx_rotation_selections_farm_period
    ON rotation_plan_selections(farm_id, planning_period);

-- Index for reports by farm
CREATE INDEX IF NOT EXISTS idx_reports_farm
    ON reports(farm_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created
    ON notifications(created_at DESC);
