import sys
import os
from pathlib import Path

# Add the src directory to Python path
current_dir = Path(__file__).parent  # tests directory
backend_dir = current_dir.parent     # backend directory  
src_dir = backend_dir / "src"        # src directory

sys.path.insert(0, str(src_dir))

# Now we can import from src
import psycopg2 # type: ignore
from config import settings
import sys

print(f" Testing database connection...")
print(f"Host: {settings.DB_HOST}")
print(f"Port: {settings.DB_PORT}")
print(f"Database: {settings.DB_NAME}")
print(f"User: {settings.DB_USER}")
print(f"Password: {'*' * len(settings.DB_PASS)} (length: {len(settings.DB_PASS)})")

try:
    # First try connecting to postgres (default database)
    print("\n Testing connection to PostgreSQL server...")
    conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database="postgres",  # Default database
        user=settings.DB_USER,
        password=settings.DB_PASS
    )
    print(" PostgreSQL server connection successful!")
    conn.close()
    
    # Now try connecting to your specific database
    print("\n Testing connection to linkpro_analytics database...")
    conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASS
    )
    print(" Database connection successful!")
    
    # Test a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f" PostgreSQL version: {version[0]}")
    
    cursor.close()
    conn.close()
    
    print("\n All database tests passed!")
    
except psycopg2.OperationalError as e:
    print(f"\n Connection failed: {e}")
    if "password authentication failed" in str(e):
        print(" Issue: Wrong password. Check your .env file.")
    elif "could not connect to server" in str(e):
        print(" Issue: PostgreSQL server is not running.")
        print(" Solution: Start PostgreSQL service")
    elif f'database "{settings.DB_NAME}" does not exist' in str(e):
        print(" Issue: Database doesn't exist.")
        print(" Solution: Create database with: psql -U postgres")
        print("   Then run: CREATE DATABASE linkpro_analytics;")
except Exception as e:
    print(f" Unexpected error: {e}")