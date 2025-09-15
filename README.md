# LinkPro Analytics

A comprehensive analytics backend system for tracking and analyzing link performance, page views, and user behavior patterns. Built with FastAPI, PostgreSQL, and SQLAlchemy.

## Overview

LinkPro Analytics provides real-time tracking capabilities for link-in-bio style applications, offering detailed insights into user engagement, traffic sources, and performance metrics. The system captures click events, page views, and generates comprehensive analytics reports for data-driven decision making.

## Features

### Core Functionality
- **Real-time Event Tracking**: Track clicks and page views with detailed metadata
- **Comprehensive Analytics**: Generate detailed performance reports for profiles and individual links
- **Traffic Source Analysis**: Identify and categorize traffic sources (Instagram, TikTok, Twitter, direct traffic)
- **Time-based Insights**: Analyze performance patterns by hour, day, and week
- **Performance Comparisons**: Compare current performance against previous periods

### Technical Features
- RESTful API architecture with FastAPI
- PostgreSQL database with optimized queries
- Pydantic models for data validation
- SQLAlchemy ORM for database operations
- CORS-enabled for frontend integration
- Interactive API documentation with Swagger UI
- Comprehensive test suite for quality assurance

## Architecture

```
backend/
├── src/
│   ├── database/
│   │   ├── connection.py      # Database configuration and connection
│   │   └── models.py          # SQLAlchemy database models
│   ├── models/
│   │   ├── analytics.py       # Pydantic models for analytics responses
│   │   ├── click.py          # Event tracking models
│   │   ├── link.py           # Link management models
│   │   └── user.py           # User profile models
│   ├── routes/
│   │   ├── analytics.py      # Analytics endpoints
│   │   ├── tracking.py       # Event tracking endpoints
│   │   └── websocket.py      # Real-time communication
│   ├── services/
│   │   ├── analytics.py      # Analytics business logic
│   │   └── report_generator.py # PDF report generation
│   ├── config.py             # Application configuration
│   └── main.py               # Application entry point
├── tests/
│   ├── test_analytics.py     # Comprehensive test suite
│   └── test_db.py           # Database connectivity tests
├── database_setup.sql        # Database schema initialization
└── requirements.txt          # Python dependencies
```

## API Endpoints

### Event Tracking
- `POST /api/track/click` - Track link click events
- `POST /api/track/view` - Track page view events
- `GET /api/track/clicks/{link_id}` - Retrieve clicks for specific link
- `GET /api/track/views/{profile_id}` - Retrieve views for profile

### Analytics
- `GET /api/analytics/profile/{profile_id}` - Complete profile analytics
- `GET /api/analytics/traffic/{profile_id}` - Traffic source analysis
- `GET /api/analytics/time/{profile_id}` - Time-based performance insights
- `GET /api/analytics/quick-stats/{profile_id}` - Summary statistics
- `GET /api/analytics/compare/{profile_id}` - Period comparison analysis

### System
- `GET /health` - Health check with database connectivity test
- `GET /api/system/info` - System information and status
- `GET /docs` - Interactive API documentation

## Data Models

### Core Entities
- **LinkProfile**: User profiles with username and title
- **Link**: Individual links with title, URL, and position
- **ClickEvent**: Click tracking with IP, user agent, and referrer
- **PageView**: Page view tracking with session information

### Analytics Models
- **BasicMetrics**: Core performance metrics (clicks, views, CTR)
- **LinkAnalytics**: Per-link performance analysis
- **ProfileAnalytics**: Comprehensive profile insights
- **TrafficAnalytics**: Traffic source breakdown
- **TimeAnalytics**: Time-based performance patterns

## Technology Stack

### Backend Framework
- **FastAPI**: Modern, high-performance web framework
- **Uvicorn**: ASGI server for production deployment
- **Pydantic**: Data validation and serialization
- **SQLAlchemy**: Object-relational mapping and database toolkit

### Database
- **PostgreSQL 17.6**: Primary database for data persistence
- **Psycopg2**: PostgreSQL adapter for Python
- **Alembic**: Database migration management

### Development Tools
- **Python 3.13.7**: Core programming language
- **Pip 25.2**: Package management
- **Python-dotenv**: Environment configuration
- **ReportLab**: PDF report generation

## Performance Considerations

The system is optimized for high-volume tracking scenarios with efficient database queries, connection pooling, and indexed columns for frequently accessed data. Analytics queries are designed to minimize database load while providing comprehensive insights.

## Security Features

- IP address validation and sanitization
- User agent truncation to prevent data overflow
- Input validation on all endpoints
- SQL injection prevention through ORM usage
- CORS configuration for controlled access

## Testing

The project includes a comprehensive test suite that validates all major functionality including database connectivity, event tracking accuracy, analytics calculation correctness, and API endpoint reliability. The test suite generates sample data and verifies system behavior under various scenarios.

## Documentation

Interactive API documentation is available at `/docs` when the server is running, providing detailed endpoint descriptions, request/response schemas, and testing capabilities.

## License

This project is designed for educational and professional development purposes in data engineering and analytics systems.