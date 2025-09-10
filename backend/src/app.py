import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

# Import our database and models
from database.connection import get_db, test_connection, engine, Base
from routes.tracking import router as tracking_router

# Create all database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="LinkPro Analytics API",
    description="Analytics dashboard for LinkPro - Track clicks, views, and user behavior",
    version="1.0.0",
    docs_url="/docs"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tracking_router)

# Basic routes
@app.get("/")
async def root():
    return {
        "message": "LinkPro Analytics API is running",
        "version": "1.0.0",
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "docs": "Visit /docs for interactive API documentation"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity test"""
    # Test database connection
    db_connected, db_info = test_connection()
    
    return {
        "status": "healthy" if db_connected else "unhealthy",
        "timestamp": datetime.now(),
        "service": "LinkPro Analytics API",
        "database": "Connected" if db_connected else "Disconnected",
        "database_info": db_info,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    }

@app.get("/api/system/info")
async def system_info():
    """Get system information"""
    return {
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "python_implementation": sys.implementation.name,
        "platform": sys.platform,
        "api_version": "1.0.0",
        "environment": "development"
    }

# Legacy endpoints for backward compatibility (these will be removed later)
@app.post("/api/track/click")
async def legacy_track_click():
    """Legacy endpoint - redirects to new tracking system"""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Use POST /api/track/click with link_id and profile_id parameters"
    )

@app.post("/api/track/view")
async def legacy_track_view():
    """Legacy endpoint - redirects to new tracking system"""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Use POST /api/track/view with profile_id parameter"
    )