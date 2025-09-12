from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_, distinct
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import re

from database.models import ClickEvent, PageView, Link, LinkProfile
from models.analytics import (
    BasicMetrics, LinkAnalytics, ProfileAnalytics, 
    TrafficSource, TrafficAnalytics, TimeBasedMetrics, TimeAnalytics
)

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_basic_metrics(self, profile_id: int, link_id: Optional[int] = None, 
                              start_date: Optional[datetime] = None, 
                              end_date: Optional[datetime] = None) -> BasicMetrics:
        """Calculate basic metrics for profile or specific link"""
        
        # Build base queries
        click_query = self.db.query(ClickEvent).filter(ClickEvent.profile_id == profile_id)
        view_query = self.db.query(PageView).filter(PageView.profile_id == profile_id)
        
        if link_id:
            click_query = click_query.filter(ClickEvent.link_id == link_id)
        
        if start_date:
            click_query = click_query.filter(ClickEvent.clicked_at >= start_date)
            view_query = view_query.filter(PageView.viewed_at >= start_date)
        
        if end_date:
            click_query = click_query.filter(ClickEvent.clicked_at <= end_date)
            view_query = view_query.filter(PageView.viewed_at <= end_date)
        
        # Calculate metrics
        total_clicks = click_query.count()
        total_views = view_query.count()
        
        unique_clicks = click_query.distinct(ClickEvent.ip_address).count()
        unique_views = view_query.distinct(PageView.ip_address).count()
        
        # Calculate CTR (Click Through Rate)
        ctr = (total_clicks / total_views * 100) if total_views > 0 else 0.0
        
        return BasicMetrics(
            total_clicks=total_clicks,
            total_views=total_views,
            unique_clicks=unique_clicks,
            unique_views=unique_views,
            click_through_rate=round(ctr, 2)
        )
    
    def get_link_analytics(self, profile_id: int, start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None) -> List[LinkAnalytics]:
        """Get analytics for all links in a profile"""
        
        links = self.db.query(Link).filter(Link.profile_id == profile_id).all()
        analytics = []
        
        for link in links:
            metrics = self.calculate_basic_metrics(
                profile_id=profile_id,
                link_id=link.id,
                start_date=start_date,
                end_date=end_date
            )
            
            analytics.append(LinkAnalytics(
                link_id=link.id,
                title=link.title,
                url=link.url,
                position=link.position,
                metrics=metrics,
                created_at=link.created_at
            ))
        
        # Sort by position
        analytics.sort(key=lambda x: x.position)
        return analytics
    
    def get_profile_analytics(self, profile_id: int, start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> ProfileAnalytics:
        """Get complete analytics for a profile"""
        
        # Get profile info
        profile = self.db.query(LinkProfile).filter(LinkProfile.id == profile_id).first()
        if not profile:
            raise ValueError("Profile not found")
        
        # Get overall metrics
        total_metrics = self.calculate_basic_metrics(
            profile_id=profile_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Get link analytics
        links_analytics = self.get_link_analytics(
            profile_id=profile_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return ProfileAnalytics(
            profile_id=profile.id,
            username=profile.username,
            title=profile.title,
            total_metrics=total_metrics,
            links_analytics=links_analytics,
            created_at=profile.created_at
        )
    
    def analyze_traffic_sources(self, profile_id: int, start_date: Optional[datetime] = None,
                               end_date: Optional[datetime] = None) -> TrafficAnalytics:
        """Analyze traffic sources from referrer data"""
        
        # Build queries
        click_query = self.db.query(ClickEvent).filter(ClickEvent.profile_id == profile_id)
        view_query = self.db.query(PageView).filter(PageView.profile_id == profile_id)
        
        if start_date:
            click_query = click_query.filter(ClickEvent.clicked_at >= start_date)
            view_query = view_query.filter(PageView.viewed_at >= start_date)
        
        if end_date:
            click_query = click_query.filter(ClickEvent.clicked_at <= end_date)
            view_query = view_query.filter(PageView.viewed_at <= end_date)
        
        # Get all referrers
        clicks = click_query.all()
        views = view_query.all()
        
        # Count by source
        source_data = {
            'instagram': {'clicks': 0, 'views': 0},
            'tiktok': {'clicks': 0, 'views': 0},
            'twitter': {'clicks': 0, 'views': 0},
            'direct': {'clicks': 0, 'views': 0},
            'other': {'clicks': 0, 'views': 0}
        }
        
        def categorize_referrer(referrer: str) -> str:
            if not referrer:
                return 'direct'
            referrer_lower = referrer.lower()
            if 'instagram' in referrer_lower or 'ig' in referrer_lower:
                return 'instagram'
            elif 'tiktok' in referrer_lower:
                return 'tiktok'
            elif 'twitter' in referrer_lower or 't.co' in referrer_lower:
                return 'twitter'
            else:
                return 'other'
        
        # Categorize clicks
        for click in clicks:
            source = categorize_referrer(click.referrer)
            source_data[source]['clicks'] += 1
        
        # Categorize views
        for view in views:
            source = categorize_referrer(view.referrer)
            source_data[source]['views'] += 1
        
        total_clicks = sum(data['clicks'] for data in source_data.values())
        total_views = sum(data['views'] for data in source_data.values())
        
        # Build response
        sources = []
        for source_name, data in source_data.items():
            if data['clicks'] > 0 or data['views'] > 0:
                percentage = (data['clicks'] / total_clicks * 100) if total_clicks > 0 else 0
                sources.append(TrafficSource(
                    source=source_name,
                    clicks=data['clicks'],
                    views=data['views'],
                    percentage=round(percentage, 2)
                ))
        
        # Sort by clicks descending
        sources.sort(key=lambda x: x.clicks, reverse=True)
        
        return TrafficAnalytics(
            profile_id=profile_id,
            sources=sources,
            total_clicks=total_clicks,
            total_views=total_views
        )
    
    def analyze_time_patterns(self, profile_id: int, granularity: str = 'daily',
                            start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> TimeAnalytics:
        """Analyze time-based patterns in clicks and views"""
        
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Build queries
        click_query = self.db.query(ClickEvent).filter(
            and_(
                ClickEvent.profile_id == profile_id,
                ClickEvent.clicked_at >= start_date,
                ClickEvent.clicked_at <= end_date
            )
        )
        
        view_query = self.db.query(PageView).filter(
            and_(
                PageView.profile_id == profile_id,
                PageView.viewed_at >= start_date,
                PageView.viewed_at <= end_date
            )
        )
        
        if granularity == 'hourly':
            # Group by hour
            click_data = self.db.query(
                func.date_trunc('hour', ClickEvent.clicked_at).label('period'),
                func.count(ClickEvent.id).label('clicks'),
                func.count(func.distinct(ClickEvent.ip_address)).label('unique_visitors')
            ).filter(
                and_(
                    ClickEvent.profile_id == profile_id,
                    ClickEvent.clicked_at >= start_date,
                    ClickEvent.clicked_at <= end_date
                )
            ).group_by('period').all()
            
            view_data = self.db.query(
                func.date_trunc('hour', PageView.viewed_at).label('period'),
                func.count(PageView.id).label('views')
            ).filter(
                and_(
                    PageView.profile_id == profile_id,
                    PageView.viewed_at >= start_date,
                    PageView.viewed_at <= end_date
                )
            ).group_by('period').all()
            
        else:  # daily
            click_data = self.db.query(
                func.date_trunc('day', ClickEvent.clicked_at).label('period'),
                func.count(ClickEvent.id).label('clicks'),
                func.count(func.distinct(ClickEvent.ip_address)).label('unique_visitors')
            ).filter(
                and_(
                    ClickEvent.profile_id == profile_id,
                    ClickEvent.clicked_at >= start_date,
                    ClickEvent.clicked_at <= end_date
                )
            ).group_by('period').all()
            
            view_data = self.db.query(
                func.date_trunc('day', PageView.viewed_at).label('period'),
                func.count(PageView.id).label('views')
            ).filter(
                and_(
                    PageView.profile_id == profile_id,
                    PageView.viewed_at >= start_date,
                    PageView.viewed_at <= end_date
                )
            ).group_by('period').all()
        
        # Combine data
        time_metrics = []
        click_dict = {str(row.period): {'clicks': row.clicks, 'unique': row.unique_visitors} for row in click_data}
        view_dict = {str(row.period): row.views for row in view_data}
        
        # Get all periods
        all_periods = set(click_dict.keys()) | set(view_dict.keys())
        
        for period in sorted(all_periods):
            click_info = click_dict.get(period, {'clicks': 0, 'unique': 0})
            views = view_dict.get(period, 0)
            
            time_metrics.append(TimeBasedMetrics(
                period=period,
                clicks=click_info['clicks'],
                views=views,
                unique_visitors=click_info['unique']
            ))
        
        # Find peak times
        peak_hour = None
        peak_day = None
        best_time_recommendation = None
        
        if granularity == 'hourly' and time_metrics:
            # Find peak hour
            hour_totals = {}
            for metric in time_metrics:
                hour = datetime.fromisoformat(metric.period).hour
                if hour not in hour_totals:
                    hour_totals[hour] = 0
                hour_totals[hour] += metric.clicks
            
            if hour_totals:
                peak_hour = max(hour_totals.items(), key=lambda x: x[1])[0]
                best_time_recommendation = f"Best posting time: {peak_hour}:00"
        
        elif granularity == 'daily' and time_metrics:
            # Find peak day of week
            day_totals = {}
            for metric in time_metrics:
                day_name = datetime.fromisoformat(metric.period).strftime('%A').lower()
                if day_name not in day_totals:
                    day_totals[day_name] = 0
                day_totals[day_name] += metric.clicks
            
            if day_totals:
                peak_day = max(day_totals.items(), key=lambda x: x[1])[0]
                best_time_recommendation = f"Best posting day: {peak_day.title()}"
        
        return TimeAnalytics(
            profile_id=profile_id,
            granularity=granularity,
            data=time_metrics,
            peak_hour=peak_hour,
            peak_day=peak_day,
            best_time_recommendation=best_time_recommendation
        )