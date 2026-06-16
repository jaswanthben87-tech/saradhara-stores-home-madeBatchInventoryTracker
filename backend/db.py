# Database management helper functions for SQLite

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tracker.db')

def get_db():
    """Returns a connection to the SQLite database file."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Executes the schema.sql script to build the tables in SQLite."""
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found at {schema_path}")
        
    with get_db() as conn:
        with open(schema_path, 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
        # Ensure password column exists in customers table
        try:
            conn.execute("SELECT password FROM customers LIMIT 1")
        except sqlite3.OperationalError:
            conn.execute("ALTER TABLE customers ADD COLUMN password TEXT NOT NULL DEFAULT 'customerpassword'")
        conn.commit()
    print("Database initialized successfully.")

def query_db(query, args=(), one=False):
    """Utility function to query the database and return results as dictionaries."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        rv = cur.fetchall()
        columns = [col[0] for col in cur.description] if cur.description else []
        cur.close()
        results = [dict(zip(columns, row)) for row in rv]
        return (results[0] if results else None) if one else results

def insert_db(query, args=()):
    """Utility function to insert data and return the last row ID."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        last_id = cur.lastrowid
        conn.commit()
        cur.close()
        return last_id

def execute_db(query, args=()):
    """Utility function to execute a write/update command."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        conn.commit()
        cur.close()
