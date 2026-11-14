"""Persistence helpers for event-based notifications."""
from datetime import datetime, timezone

from database.db import execute_db, query_db


def create_notification(category, title, message, event_key):
    """Create one notification per source event and return the stored row."""
    created_at = datetime.now(timezone.utc).isoformat(timespec='seconds').replace(
        '+00:00', 'Z'
    )
    execute_db(
        '''INSERT OR IGNORE INTO notifications
           (category, title, message, event_key, created_at)
           VALUES (?, ?, ?, ?, ?)''',
        (category, title, message, event_key, created_at),
    )
    notification = query_db(
        'SELECT * FROM notifications WHERE event_key = ?', (event_key,), one=True
    )
    return serialize_notification(notification)


def get_notifications():
    rows = query_db(
        'SELECT * FROM notifications ORDER BY created_at DESC, id DESC'
    )
    notifications = [serialize_notification(row) for row in rows]
    return {
        'notifications': notifications,
        'unread_count': sum(not notification['read'] for notification in notifications),
    }


def mark_all_read():
    execute_db('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
    return get_notifications()


def mark_read(notification_id):
    execute_db(
        'UPDATE notifications SET is_read = 1 WHERE id = ?', (notification_id,)
    )
    row = query_db(
        'SELECT * FROM notifications WHERE id = ?', (notification_id,), one=True
    )
    return serialize_notification(row) if row else None


def dismiss_notification(notification_id):
    existing = query_db(
        'SELECT id FROM notifications WHERE id = ?', (notification_id,), one=True
    )
    if not existing:
        return False
    execute_db('DELETE FROM notifications WHERE id = ?', (notification_id,))
    return True


def serialize_notification(row):
    if row is None:
        return None
    return {
        'id': row['id'],
        'category': row['category'],
        'title': row['title'],
        'message': row['message'],
        'time': row['created_at'],
        'read': bool(row['is_read']),
    }
