from pydantic import BaseModel, validator, HttpUrl # type: ignore
from datetime import datetime
from typing import Optional

class LinkBase(BaseModel):
    title: str
    url: str
    position: Optional[int] = 0

class LinkCreate(LinkBase):
    profile_id: int
    
    @validator('title')
    def validate_title(cls, v):
        if len(v) < 1:
            raise ValueError('Title cannot be empty')
        if len(v) > 100:
            raise ValueError('Title must be less than 100 characters')
        return v.strip()
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    position: Optional[int] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if len(v) < 1:
                raise ValueError('Title cannot be empty')
            if len(v) > 100:
                raise ValueError('Title must be less than 100 characters')
            return v.strip()
        return v
    
    @validator('url')
    def validate_url(cls, v):
        if v is not None:
            if not v.startswith(('http://', 'https://')):
                v = 'https://' + v
        return v

class LinkResponse(LinkBase):
    id: int
    profile_id: int
    created_at: datetime
    click_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class LinkStats(BaseModel):
    link_id: int
    title: str
    url: str
    total_clicks: int
    unique_clicks: int
    click_through_rate: float
    position: int
    created_at: datetime