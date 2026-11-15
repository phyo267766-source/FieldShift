"""
FieldShift – Adapting Farms with NASA Data
Flask Backend Application

NASA Space Apps Challenge 2026
"""
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from database.db import init_db, set_db_path
from routes.farm_routes import farm_bp
from routes.climate_routes import climate_bp
from routes.rotation_routes import rotation_bp
from routes.report_routes import report_bp
from routes.weather_routes import weather_bp
from routes.notification_routes import notification_bp
from routes.chat_routes import chat_bp


def create_app(config_class=Config):
    """Application factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Set database path
    set_db_path(config_class.DATABASE_PATH)

    # Enable CORS for the frontend
    CORS(app, origins=config_class.CORS_ORIGINS)

    # Register blueprints
    app.register_blueprint(farm_bp)
    app.register_blueprint(climate_bp)
    app.register_blueprint(rotation_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(chat_bp)

    # Health check / API info
    @app.route('/api', methods=['GET'])
    def api_info():
        return jsonify({
            'name': 'FieldShift API',
            'version': '1.0.0',
            'description': 'Smart farming backend — Adapting Farms with NASA Data',
            'endpoints': {
                'farms': '/api/farms',
                'climate': '/api/climate/farm/<farm_id>',
                'weather': '/api/weather/current?lat=&lon=',
                'rotation': '/api/rotation/generate',
                'reports': '/api/reports',
                'notifications': '/api/notifications',
            },
        })

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'service': 'FieldShift API'})

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found.'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed.'}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error.'}), 500

    # Initialize database on first request
    with app.app_context():
        init_db()

    return app


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app = create_app()
    # Use 127.0.0.1 (not 0.0.0.0) and do NOT enable debug in production.
    # Debug is controlled by the FLASK_DEBUG environment variable.
    app.run(
        host='127.0.0.1',
        port=int(os.getenv('PORT', '5001')),
        debug=app.config.get('DEBUG', False),
    )
