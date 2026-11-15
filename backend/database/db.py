"""
Database initialization and connection management for FieldShift.
Uses Python's built-in sqlite3 module.
"""
import os
import sqlite3

_db_path = None


def set_db_path(path):
    """Set the database file path."""
    global _db_path
    _db_path = path


def get_db_path():
    """Get the current database file path."""
    if _db_path:
        return _db_path
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fieldshift.db')


def get_connection():
    """
    Create and return a new database connection.
    Enables foreign keys and returns rows as dictionaries.
    """
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def init_db():
    """
    Initialize the database using schema.sql.
    Creates tables if they do not already exist.
    """
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')

    # Ensure the directory exists
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = get_connection()
    try:
        with open(schema_path, 'r') as f:
            conn.executescript(f.read())
        farm_columns = {
            row['name'] for row in conn.execute('PRAGMA table_info(farms)').fetchall()
        }
        if 'district' not in farm_columns:
            conn.execute("ALTER TABLE farms ADD COLUMN district TEXT NOT NULL DEFAULT ''")
        if 'township' not in farm_columns:
            conn.execute("ALTER TABLE farms ADD COLUMN township TEXT NOT NULL DEFAULT ''")
        conn.commit()
        print(f'[FieldShift] Database initialized at {db_path}')
    finally:
        conn.close()


def dict_from_row(row):
    """Convert a sqlite3.Row to a regular dictionary."""
    if row is None:
        return None
    return dict(row)


def query_db(sql, params=(), one=False):
    """
    Execute a SELECT query and return results as dictionaries.
    If one=True, return only the first result or None.
    """
    conn = get_connection()
    try:
        cursor = conn.execute(sql, params)
        rows = cursor.fetchall()
        results = [dict_from_row(row) for row in rows]
        return results[0] if one and results else (None if one else results)
    finally:
        conn.close()


def execute_db(sql, params=()):
    """
    Execute an INSERT, UPDATE, or DELETE query.
    Returns the lastrowid for INSERT operations.
    """
    conn = get_connection()
    try:
        cursor = conn.execute(sql, params)
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()
