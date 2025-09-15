from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class BasicMetrics(BaseModel):
    """Basic analytics metrics for a profile or link"""
    total_clicks: int
    total_views: int
    unique_clicks: int
    unique_views: int
    click_through_rate: float  # clicks/views * 100
    
class LinkAnalytics(BaseModel):
    """Analytics data for a specific link"""
    link_id: int
    title: str
    url: str
    position: int
    metrics: BasicMetrics
    created_at: datetime

class ProfileAnalytics(BaseModel):
    """Complete analytics for a user profile"""
    profile_id: int
    username: str
    title: Optional[str]
    total_metrics: BasicMetrics
    links_analytics: List[LinkAnalytics]
    created_at: datetime

class TrafficSource(BaseModel):
    """Traffic source breakdown"""
    source: str  
    clicks: int
    views: int
    percentage: float

class TrafficAnalytics(BaseModel):
    """Traffic source analysis"""
    profile_id: int
    sources: List[TrafficSource]
    total_clicks: int
    total_views: int

class TimeBasedMetrics(BaseModel):
    """Metrics for a specific time period"""
    period: str  
    clicks: int
    views: int
    unique_visitors: int

class TimeAnalytics(BaseModel):
    """Time-based analytics"""
    profile_id: int
    granularity: str  
    data: List[TimeBasedMetrics]
    peak_hour: Optional[int] = None  
    peak_day: Optional[str] = None  
    best_time_recommendation: Optional[str] = None

class AnalyticsPeriod(BaseModel):
    """Date range for analytics queries"""
    start_date: datetime
    end_date: datetime
    
class AnalyticsQuery(BaseModel):
    """Query parameters for analytics"""
    profile_id: int
    period: Optional[AnalyticsPeriod] = None
    include_traffic_sources: bool = True
    include_time_analysis: bool = True
    granularity: str = 'daily'  