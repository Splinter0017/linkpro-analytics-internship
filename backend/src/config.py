import os
from dotenv import load_dotenv # type: ignore

# Make sure to load from the correct path
load_dotenv()

class Settings:
    # Database settings with fallbacks
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432") 
    DB_NAME = os.getenv("DB_NAME", "linkpro_analytics")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASS", "idkIDK168292")  # Your actual password as fallback
    
    # Build database URL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # API settings
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "idkIDK168292")
    
    # Analytics settings
    CLICK_BATCH_SIZE = int(os.getenv("CLICK_BATCH_SIZE", "1000"))
    ANALYTICS_CACHE_TTL = int(os.getenv("ANALYTICS_CACHE_TTL", "300"))  # 5 minutes

settings = Settings()

# Test database connection on import
def test_db_connection():
    try:
        import psycopg2 # type: ignore
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
        return True
    except:
        return False