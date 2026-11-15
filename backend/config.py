"""
FieldShift Backend Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'fieldshift-dev-key-change-in-production')
    DATABASE_PATH = os.getenv('DATABASE_PATH', os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'database', 'fieldshift.db'
    ))

    # NASA POWER API (free, no key required)
    NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal'
    NASA_POWER_TIMEOUT = 30  # seconds

    # Meteomatics Weather API
    METEOMATICS_USERNAME = os.getenv('METEOMATICS_USERNAME', '')
    METEOMATICS_PASSWORD = os.getenv('METEOMATICS_PASSWORD', '')
    METEOMATICS_TIMEOUT = int(os.getenv('METEOMATICS_TIMEOUT', '20'))

    # CORS settings
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5176,http://127.0.0.1:5176',
    ).split(',')

    # Cache settings
    CLIMATE_CACHE_HOURS = int(os.getenv('CLIMATE_CACHE_HOURS', '24'))

    # AI Chatbot configuration
    AI_API_KEY = os.getenv('AI_API_KEY', '')
    AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')
    AI_API_BASE = os.getenv('AI_API_BASE', 'https://api.openai.com/v1')
    AI_MAX_TOKENS = int(os.getenv('AI_MAX_TOKENS', '1024'))
    AI_TIMEOUT = int(os.getenv('AI_TIMEOUT', '30'))
    AI_MAX_HISTORY = int(os.getenv('AI_MAX_HISTORY', '20'))

    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
