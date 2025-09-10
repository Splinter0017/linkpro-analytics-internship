from pydantic import BaseModel, validator # type: ignore
from datetime import datetime
from typing import Optional
import ipaddress

class ClickEventBase(BaseModel):
    link_id: int
    profile_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class ClickEventCreate(ClickEventBase):
    @validator('ip_address')
    def validate_ip_address(cls, v):
        if v is not None:
            try:
                ipaddress.ip_address(v)
            except ValueError:
                raise ValueError('Invalid IP address format')
        return v
    
    @validator('user_agent')
    def validate_user_agent(cls, v):
        if v is not None and len(v) > 1000:
            return v[:1000]  # Truncate long user agents
        return v
    
    @validator('referrer')
    def validate_referrer(cls, v):
        if v is not None and len(v) > 1000:
            return v[:1000]  # Truncate long referrers
        return v

class ClickEventResponse(ClickEventBase):
    id: int
    clicked_at: datetime
    
    class Config:
        from_attributes = True

class PageViewBase(BaseModel):
    profile_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class PageViewCreate(PageViewBase):
    @validator('ip_address')
    def validate_ip_address(cls, v):
        if v is not None:
            try:
                ipaddress.ip_address(v)
            except ValueError:
                raise ValueError('Invalid IP address format')
        return v

class PageViewResponse(PageViewBase):
    id: int
    viewed_at: datetime
    
    class Config:
        from_attributes = True

class TrackingResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    event_id: Optional[int] = None