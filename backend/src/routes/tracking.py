from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database.connection import get_db
from database.models import ClickEvent, PageView, Link, LinkProfile
from models.click import (
    ClickEventCreate, 
    ClickEventResponse, 
    PageViewCreate, 
    PageViewResponse, 
    TrackingResponse
)

router = APIRouter(prefix="/api/track", tags=["tracking"])

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

@router.post("/click", response_model=TrackingResponse)
async def track_click_event(
    request: Request,
    link_id: int,
    profile_id: int,
    referrer: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Track a link click event"""
    try:
        # Verify link exists
        link = db.query(Link).filter(Link.id == link_id).first()
        if not link:
            raise HTTPException(status_code=404, detail="Link not found")
        
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Create click event
        click_data = ClickEventCreate(
            link_id=link_id,
            profile_id=profile_id,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            referrer=referrer
        )
        
        # Save to database
        db_click = ClickEvent(**click_data.dict())
        db.add(db_click)
        db.commit()
        db.refresh(db_click)
        
        return TrackingResponse(
            status="success",
            message="Click tracked successfully",
            timestamp=db_click.clicked_at,
            event_id=db_click.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error tracking click: {str(e)}")

@router.post("/view", response_model=TrackingResponse)
async def track_page_view(
    request: Request,
    profile_id: int,
    referrer: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Track a page view event"""
    try:
        # Verify profile exists
        profile = db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Create page view
        view_data = PageViewCreate(
            profile_id=profile_id,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            referrer=referrer
        )
        
        # Save to database
        db_view = PageView(**view_data.dict())
        db.add(db_view)
        db.commit()
        db.refresh(db_view)
        
        return TrackingResponse(
            status="success",
            message="Page view tracked successfully",
            timestamp=db_view.viewed_at,
            event_id=db_view.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error tracking page view: {str(e)}")

@router.get("/clicks/{link_id}")
async def get_link_clicks(
    link_id: int,
    db: Session = Depends(get_db)
):
    """Get all clicks for a specific link"""
    clicks = db.query(ClickEvent).filter(ClickEvent.link_id == link_id).all()
    return {
        "link_id": link_id,
        "total_clicks": len(clicks),
        "clicks": [ClickEventResponse.from_orm(click) for click in clicks]
    }

@router.get("/views/{profile_id}")
async def get_profile_views(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Get all page views for a specific profile"""
    views = db.query(PageView).filter(PageView.profile_id == profile_id).all()
    return {
        "profile_id": profile_id,
        "total_views": len(views),
        "views": [PageViewResponse.from_orm(view) for view in views]
    }