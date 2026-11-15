"""API routes for persisted event notifications."""
from flask import Blueprint, jsonify

from services.notification_service import (
    dismiss_notification,
    get_notifications,
    mark_all_read,
    mark_read,
)

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notification_bp.route('', methods=['GET'])
def list_notifications():
    return jsonify(get_notifications()), 200


@notification_bp.route('/read', methods=['PUT'])
def read_all_notifications():
    return jsonify(mark_all_read()), 200


@notification_bp.route('/<int:notification_id>/read', methods=['PATCH'])
def read_notification(notification_id):
    notification = mark_read(notification_id)
    if notification is None:
        return jsonify({'error': 'Notification not found.'}), 404
    return jsonify({'notification': notification}), 200


@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    if not dismiss_notification(notification_id):
        return jsonify({'error': 'Notification not found.'}), 404
    return jsonify({'message': 'Notification dismissed.'}), 200
