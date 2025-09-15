# LinkPro Analytics - Complete Setup Guide

## System Requirements

This setup guide is specifically designed for Windows 11 environments with the following software versions:
- Python 3.13.7
- Pip 25.2
- PostgreSQL 17.6
- Windows 11 operating system

## Prerequisites Installation

### Python 3.13.7 Installation
Download and install Python 3.13.7 from the official Python website. During installation, ensure that "Add Python to PATH" is selected to enable command-line access.

### PostgreSQL 17.6 Setup
Download PostgreSQL 17.6 from the official PostgreSQL website. During installation, configure the following settings:
- Set a secure password for the postgres superuser account
- Configure the default port as 5432
- Enable the pgAdmin management tool
- Add PostgreSQL bin directory to system PATH

Verify PostgreSQL installation by opening Command Prompt and executing:
```cmd
psql --version
```

### Project Repository Setup
Clone or download the LinkPro Analytics project repository to your local development environment. Navigate to the project root directory using Command Prompt.

## Database Configuration

### Database Creation
Connect to PostgreSQL as the superuser and create the analytics database:
```sql
CREATE DATABASE linkpro_analytics;
CREATE USER linkpro_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE linkpro_analytics TO linkpro_user;
```

### Schema Initialization
Execute the database setup script to create the required tables:
```cmd
psql -U postgres -d linkpro_analytics -f database_setup.sql
```

The schema creates four primary tables: link_profiles for user accounts, links for tracked URLs, click_events for click tracking, and page_views for page view analytics.

## Environment Configuration

### Virtual Environment Setup
Create and activate a Python virtual environment to isolate project dependencies:
```cmd
python -m venv venv
venv\Scripts\activate
```

### Dependency Installation
Install all required Python packages using the requirements file:
```cmd
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file in the backend directory with the following configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=linkpro_analytics
DB_USER=postgres
DB_PASS=your_database_password
SECRET_KEY=your_secure_secret_key
API_HOST=0.0.0.0
API_PORT=8000
```

Replace `your_database_password` with the PostgreSQL password configured during installation and `your_secure_secret_key` with a randomly generated secure string.

## Application Testing

### Database Connectivity Verification
Test database connectivity using the provided test script:
```cmd
python src\tests\test_db.py
```

This script validates PostgreSQL server connectivity, database access, and basic query execution.

### Comprehensive System Testing
Execute the complete test suite to verify all system components:
```cmd
python backend\tests\test_analytics.py
```

The test suite performs connection validation, generates sample tracking data, tests all analytics endpoints, and provides a comprehensive system status report.

## Server Deployment

### Development Server Launch
Start the FastAPI development server with hot reload capability:
```cmd
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Automated Startup Script
For convenience, execute the provided batch script:
```cmd
start_server.bat
```

This script automatically activates the virtual environment and launches the server with optimal development settings.

### Service Verification
Verify server functionality by accessing the following endpoints:
- Health check: http://localhost:8000/health
- Interactive documentation: http://localhost:8000/docs
- System information: http://localhost:8000/api/system/info

## API Integration

### Event Tracking Implementation
Integrate click tracking by sending POST requests to `/api/track/click` with link_id, profile_id, and optional referrer parameters. Page view tracking utilizes `/api/track/view` with profile_id and referrer information.

### Analytics Data Retrieval
Access comprehensive analytics through dedicated endpoints. Profile analytics are available at `/api/analytics/profile/{profile_id}`, traffic source analysis at `/api/analytics/traffic/{profile_id}`, and time-based insights at `/api/analytics/time/{profile_id}`.

### Query Parameters and Filtering
Most analytics endpoints support optional date range filtering through start_date and end_date parameters using YYYY-MM-DD format. Time analytics endpoints accept granularity parameters for hourly or daily aggregation.

## Production Considerations

### Database Optimization
For production deployment, configure PostgreSQL connection pooling, enable query optimization through proper indexing, and implement backup strategies for data protection.

### Security Configuration
Implement proper CORS policies by specifying exact frontend origins rather than wildcard permissions. Configure environment-specific secret keys and database credentials using secure management practices.

### Performance Monitoring
Monitor application performance through built-in health check endpoints and database connectivity tests. Implement logging for tracking system behavior and identifying potential issues.

## Troubleshooting

### Common Database Issues
If database connectivity fails, verify PostgreSQL service status through Windows Services management console. Confirm firewall settings allow connections on port 5432 and validate database credentials in the environment configuration.

### Python Environment Problems
Virtual environment activation failures typically indicate incorrect Python installation or PATH configuration. Verify Python installation and recreate the virtual environment if necessary.

### API Server Errors
Server startup failures often result from port conflicts or missing dependencies. Confirm port 8000 availability and verify all requirements are properly installed in the active virtual environment.

## Development Workflow

### Code Modification Testing
After making code changes, the development server automatically reloads due to the `--reload` flag. Test changes through the interactive documentation interface or by running the comprehensive test suite.

### Database Schema Updates
Schema modifications require updating both the SQLAlchemy models and the database_setup.sql file. Apply changes carefully and test with the database connectivity verification script.

### Analytics Feature Development
New analytics features should follow the established pattern of service layer implementation, route definition, and comprehensive testing. Utilize the existing analytics service as a template for consistent code structure.

This setup guide provides a complete foundation for deploying and developing the LinkPro Analytics system in a Windows 11 environment with the specified software versions.