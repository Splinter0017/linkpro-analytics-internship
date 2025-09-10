from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey  # type: ignore
from sqlalchemy.dialects.postgresql import INET # type: ignore
from sqlalchemy.orm import relationship # type: ignore
from sqlalchemy.sql import func # type: ignore
from .connection import Base

class LinkProfile(Base):
    __tablename__ = "link_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    links = relationship("Link", back_populates="profile", cascade="all, delete-orphan")
    click_events = relationship("ClickEvent", back_populates="profile", cascade="all, delete-orphan")
    page_views = relationship("PageView", back_populates="profile", cascade="all, delete-orphan")

class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("link_profiles.id"), nullable=False)
    title = Column(String(100), nullable=False)
    url = Column(Text, nullable=False)
    position = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("LinkProfile", back_populates="links")
    click_events = relationship("ClickEvent", back_populates="link", cascade="all, delete-orphan")

class ClickEvent(Base):
    __tablename__ = "click_events"
    
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False)
    profile_id = Column(Integer, ForeignKey("link_profiles.id"), nullable=False)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    ip_address = Column(INET)
    user_agent = Column(Text)
    referrer = Column(Text)
    
    # Relationships
    link = relationship("Link", back_populates="click_events")
    profile = relationship("LinkProfile", back_populates="click_events")

class PageView(Base):
    __tablename__ = "page_views"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("link_profiles.id"), nullable=False)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    ip_address = Column(INET)
    user_agent = Column(Text)
    referrer = Column(Text)
    
    # Relationships
    profile = relationship("LinkProfile", back_populates="page_views")