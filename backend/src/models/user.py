from pydantic import BaseModel, validator # type: ignore
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    title: Optional[str] = None

class UserCreate(UserBase):
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens and underscores')
        return v.lower()

class UserUpdate(BaseModel):
    title: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    total_links: Optional[int] = 0
    total_clicks: Optional[int] = 0
    total_views: Optional[int] = 0
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    user_id: int
    username: str
    total_links: int
    total_clicks: int
    total_views: int
    click_through_rate: float
    most_clicked_link: Optional[str] = None
    created_at: datetime