# Call Center Backend API

FastAPI backend for the call center management system. This backend replaces the Next.js API routes while maintaining identical functionality and API contracts.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Async SQLAlchemy**: Asynchronous database operations with SQLite support
- **Pydantic Validation**: Request/response validation and serialization
- **CORS Support**: Cross-origin resource sharing for frontend communication
- **WebSocket Support**: Real-time features and notifications
- **Comprehensive Testing**: Unit tests, integration tests, and property-based testing
- **Auto-generated Documentation**: OpenAPI/Swagger documentation
- **Structured Logging**: JSON-formatted logging with structured data
- **Environment Configuration**: Environment-specific settings management

## Quick Start

### Prerequisites

- Python 3.12 or higher
- Conda package manager (recommended for Windows)
- Git for version control

### Installation (Windows with Conda)

#### Option 1: Automated Setup (Recommended)

Run the setup script for your shell:

**Command Prompt:**

```cmd
setup_conda_env.bat
```

**PowerShell:**

```powershell
.\setup_conda_env.ps1
```

#### Option 2: Manual Setup

1. Create and activate a conda environment:

```cmd
conda create -n fastapi-backend python=3.12 -y
conda activate fastapi-backend

source venv/bin/activate
```

2. Install dependencies:

```cmd
pip install -r requirements.txt
```

3. Set up environment variables:

```cmd
copy .env.example .env
# Edit .env with your configuration using notepad or your preferred editor
notepad .env
```

4. Run the development server:

```cmd
python start_server.py
```

The API will be available at:

- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc
- WebSocket: ws://localhost:8000/api/ws

### Alternative Installation (Virtual Environment)

If you prefer using virtual environments instead of conda:

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python start_server.py
```

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   └── routes/         # Individual route modules
│   ├── core/               # Core application components
│   │   ├── config.py       # Configuration management
│   │   ├── database.py     # Database setup and sessions
│   │   └── exceptions.py   # Custom exception classes
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── main.py             # FastAPI application entry point
├── tests/                  # Test suite
├── requirements.txt        # Python dependencies
├── pyproject.toml         # Project configuration
└── README.md              # This file
```

## API Endpoints

The backend implements all endpoints from the original Next.js API:

- `/api/alerts` - Alert management
- `/api/cases` - Case management
- `/api/feed` - Feed items
- `/api/search` - Search functionality
- `/api/uploads` - File upload management
- `/api/upload` - File upload endpoint
- `/api/trending` - Trending topics
- `/api/chat` - Chat functionality
- `/api/events` - Event logging
- `/api/export` - Data export
- `/api/inbox` - Inbox management
- `/api/predictions` - Prediction analytics
- `/api/pulse` - Pulse analytics
- `/api/shares` - Sharing and escalation

## Development

### Running Tests

```cmd
# Activate environment first
conda activate fastapi-backend

# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test types
python -m pytest tests/ -m unit          # Unit tests only
python -m pytest tests/ -m integration   # Integration tests only
python -m pytest tests/ -m property      # Property-based tests only

# Run property-based tests with verbose output
python -m pytest tests/test_property_*.py -v -s
```

### Code Quality

```cmd
# Activate environment first
conda activate fastapi-backend

# Format code
python -m black app\ tests\

# Sort imports
python -m isort app\ tests\

# Type checking
python -m mypy app\

# Linting
python -m flake8 app\ tests\
```

### Database

The backend connects to the existing SQLite database (`call-center.db`) without requiring data migration. The SQLAlchemy models are designed to match the existing Drizzle schema exactly.

### Development Server

Start the development server with hot reload:

```cmd
conda activate fastapi-backend
python start_server.py
```

Or use uvicorn directly:

```cmd
conda activate fastapi-backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Configuration

Environment variables can be set in the `.env` file:

- `DATABASE_URL`: Database connection string
- `DEBUG`: Enable debug mode
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `SECRET_KEY`: Secret key for JWT tokens
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Deployment

### Docker

```cmd
# Build image
docker build -t call-center-backend .

# Run container
docker run -p 8000:8000 call-center-backend

# Using docker-compose
docker-compose up -d
```

### Production

For production deployment:

1. Set `DEBUG=false` in environment
2. Use a production WSGI server like Gunicorn
3. Configure proper logging and monitoring
4. Set up reverse proxy (nginx, etc.)
5. Use environment-specific configuration

### Health Check

Check if the API is running:

```cmd
# Using curl (if available)
curl http://localhost:8000/health

# Using PowerShell
Invoke-RestMethod -Uri http://localhost:8000/health

# Or open in browser
start http://localhost:8000/health
```

## Migration from Next.js

This backend is designed to be a drop-in replacement for the Next.js API routes. The migration process involves:

1. Deploy the FastAPI backend alongside the existing Next.js app
2. Update the Next.js frontend to point to the new backend
3. Test all functionality thoroughly
4. Remove the Next.js API routes once migration is complete

All API contracts are maintained to ensure zero-downtime migration.
