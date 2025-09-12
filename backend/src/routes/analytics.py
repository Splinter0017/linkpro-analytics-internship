from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from database.connection import get_db
from database.models import LinkProfile
from models.analytics import ProfileAnalytics, TrafficAnalytics, TimeAnalytics
from services.analytics import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def parse_date(date_string: str) -> datetime:
    """Parse date string to datetime object"""
    try:
        return datetime.fromisoformat(date_string)
    except ValueError:
        try:
            return datetime.strptime(date_string, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date_string}. Use YYYY-MM-DD or ISO format")

@router.get("/profile/{profile_id}", response_model=ProfileAnalytics)
async def get_profile_analytics(
    profile_id: int,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get complete analytics for a profile"""
    try:
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Parse dates
        start_dt = parse_date(start_date) if start_date else None
        end_dt = parse_date(end_date) if end_date else None
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        return analytics_service.get_profile_analytics(
            profile_id=profile_id,
            start_date=start_dt,
            end_date=end_dt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@router.get("/traffic/{profile_id}", response_model=TrafficAnalytics)
async def get_traffic_analytics(
    profile_id: int,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get traffic source analytics for a profile"""
    try:
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Parse dates
        start_dt = parse_date(start_date) if start_date else None
        end_dt = parse_date(end_date) if end_date else None
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        return analytics_service.analyze_traffic_sources(
            profile_id=profile_id,
            start_date=start_dt,
            end_date=end_dt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting traffic analytics: {str(e)}")

@router.get("/time/{profile_id}", response_model=TimeAnalytics)
async def get_time_analytics(
    profile_id: int,
    granularity: str = Query('daily', description="Time granularity: 'hourly' or 'daily'"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get time-based analytics for a profile"""
    try:
        # Validate granularity
        if granularity not in ['hourly', 'daily']:
            raise HTTPException(status_code=400, detail="Granularity must be 'hourly' or 'daily'")
        
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Parse dates
        start_dt = parse_date(start_date) if start_date else None
        end_dt = parse_date(end_date) if end_date else None
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        return analytics_service.analyze_time_patterns(
            profile_id=profile_id,
            granularity=granularity,
            start_date=start_dt,
            end_date=end_dt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting time analytics: {str(e)}")

@router.get("/quick-stats/{profile_id}")
async def get_quick_stats(
    profile_id: int,
    days: int = Query(7, description="Number of days to analyze (default: 7)"),
    db: Session = Depends(get_db)
):
    """Get quick stats for the last N days"""
    try:
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get analytics
        analytics_service = AnalyticsService(db)
        
        # Get basic metrics
        metrics = analytics_service.calculate_basic_metrics(
            profile_id=profile_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Get top performing link
        links_analytics = analytics_service.get_link_analytics(
            profile_id=profile_id,
            start_date=start_date,
            end_date=end_date
        )
        
        top_link = None
        if links_analytics:
            top_link = max(links_analytics, key=lambda x: x.metrics.total_clicks)
        
        return {
            "profile_id": profile_id,
            "period_days": days,
            "summary": {
                "total_clicks": metrics.total_clicks,
                "total_views": metrics.total_views,
                "click_through_rate": metrics.click_through_rate,
                "unique_visitors": metrics.unique_views
            },
            "top_performing_link": {
                "title": top_link.title if top_link else None,
                "clicks": top_link.metrics.total_clicks if top_link else 0,
                "ctr": top_link.metrics.click_through_rate if top_link else 0
            } if top_link else None,
            "total_links": len(links_analytics),
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quick stats: {str(e)}")

@router.get("/compare/{profile_id}")
async def compare_periods(
    profile_id: int,
    current_days: int = Query(7, description="Current period days"),
    previous_days: int = Query(7, description="Previous period days"),
    db: Session = Depends(get_db)
):
    """Compare current period with previous period"""
    try:
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        end_date = datetime.now()
        current_start = end_date - timedelta(days=current_days)
        previous_start = current_start - timedelta(days=previous_days)
        previous_end = current_start
        
        analytics_service = AnalyticsService(db)
        
        # Get current period metrics
        current_metrics = analytics_service.calculate_basic_metrics(
            profile_id=profile_id,
            start_date=current_start,
            end_date=end_date
        )
        
        # Get previous period metrics
        previous_metrics = analytics_service.calculate_basic_metrics(
            profile_id=profile_id,
            start_date=previous_start,
            end_date=previous_end
        )
        
        # Calculate changes
        def calculate_change(current: int, previous: int) -> dict:
            if previous == 0:
                return {"absolute": current, "percentage": 100.0 if current > 0 else 0.0}
            change = current - previous
            percentage = (change / previous) * 100
            return {"absolute": change, "percentage": round(percentage, 2)}
        
        return {
            "profile_id": profile_id,
            "current_period": {
                "days": current_days,
                "start": current_start.isoformat(),
                "end": end_date.isoformat(),
                "metrics": current_metrics
            },
            "previous_period": {
                "days": previous_days,
                "start": previous_start.isoformat(),
                "end": previous_end.isoformat(),
                "metrics": previous_metrics
            },
            "changes": {
                "clicks": calculate_change(current_metrics.total_clicks, previous_metrics.total_clicks),
                "views": calculate_change(current_metrics.total_views, previous_metrics.total_views),
                "ctr": {
                    "absolute": round(current_metrics.click_through_rate - previous_metrics.click_through_rate, 2),
                    "percentage": round(((current_metrics.click_through_rate - previous_metrics.click_through_rate) / previous_metrics.click_through_rate * 100) if previous_metrics.click_through_rate > 0 else 0, 2)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing periods: {str(e)}")