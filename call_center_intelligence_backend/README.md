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

## Docker Deployment

### Quick Start with Docker

The easiest way to run the backend is using Docker with environment variables. **Note: For full-stack development, use the root project setup.**

**Full-stack development (recommended):**

```bash
# From the project root directory
make setup  # Creates .env from template
make dev    # Starts all services (frontend, backend, database, redis)
```

**Backend-only development:**

```bash
# Copy and configure environment variables (now in project root)
cp ../.env.example ../.env
# Edit ../.env with your configuration (especially DB_HOST and REDIS_URL)

# Build and start the development environment
make dev

# Or manually:
docker-compose up --build -d
```

The API will be available at:

- API: http://localhost:8000
- Documentation: http://localhost:8000/docs

**Prerequisites:**

- PostgreSQL running (configure DB_HOST, DB_PORT, etc. in .env)
- Redis running (configure REDIS_URL in .env)

**Important for Docker:**

- Use `host.docker.internal` as DB_HOST to connect to services on your host machine
- Make sure your PostgreSQL accepts connections from Docker containers
- Development mode automatically seeds the database with sample data

### Docker Commands

```bash
# Development
make build          # Build the Docker image
make up            # Start development environment (with seeding)
make down          # Stop development environment
make logs          # View logs
make shell         # Open shell in backend container
make test          # Run tests in container
make seed          # Run database seeding manually

# Production
make prod-up       # Start production environment (no seeding)
make prod-down     # Stop production environment

# Cleanup
make clean         # Clean up Docker resources
```

### Manual Docker Commands

```bash
# Build the image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Run tests
docker-compose exec backend python -m pytest tests/ -v
```

### Database Operations

Since PostgreSQL is running separately, use your existing database management tools:

```bash
# Connect to your PostgreSQL instance directly
psql -h localhost -U postgres -d call_center

# Or use your preferred database client
# Make sure the connection details match your .env file
```

### Database Seeding

The development environment automatically seeds the database with sample data:

```bash
# Start with automatic seeding (default)
make dev

# Start without seeding
SEED_DATABASE=false make up

# Run seeding manually
make seed

# Check seeding status in logs
make logs
```

**Sample Data Includes:**

- 3 users (admin, agent, manager)
- 50 sample cases with various statuses
- 20 alerts with different severities
- 5 trending topics
- 15 feed items

**Production Note:** Seeding is automatically disabled in production mode.

### Access Points

- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

**External Services (configure in .env):**

- **PostgreSQL**: Your existing PostgreSQL instance
- **Redis**: Your existing Redis instance

# Access backend shell

docker-compose exec backend /bin/bash

````

### Production Deployment

For production deployment with Docker:

```bash
# Create production environment file
cp .env.example .env.prod
# Edit .env.prod with production values

# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
````

## Local Development

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
python main.py
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
python main.py
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
python main.py
```

Or use uvicorn directly:

```cmd
conda activate fastapi-backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Configuration

All configuration is now handled through environment variables. Copy the example file and customize:

```bash
# Copy example environment file
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**

- `DB_HOST`: PostgreSQL host
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: PostgreSQL database name
- `SECRET_KEY`: Secret key for JWT tokens (generate secure key for production)

**Optional Environment Variables:**

- `DEBUG`: Enable debug mode (default: true)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `RELOAD`: Enable auto-reload in development (default: true)
- `LOG_LEVEL`: Logging level (default: INFO)
- `LOG_FORMAT`: Log format - json or text (default: json)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (default: 30)
- `MAX_FILE_SIZE`: Maximum upload size in bytes (default: 10485760)
- `ALLOWED_FILE_TYPES`: Allowed file extensions (default: .csv,.xlsx,.xls)
- `REDIS_URL`: Redis connection URL (default: redis://localhost:6379/0)
- `CACHE_TTL`: Cache TTL in seconds (default: 300)
- `SERVER_NAME`: Server name for nginx (default: localhost)
- `ALLOWED_HOSTS`: Allowed hosts for security (default: localhost,127.0.0.1,0.0.0.0)
- `SEED_DATABASE`: Enable database seeding in development (default: true)

**Azure OpenAI Configuration:**

- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_OPENAI_API_VERSION`: Azure OpenAI API version (default: 2024-12-01-preview)
- `AZURE_EMBEDDING_DEPLOYMENT`: Azure OpenAI embedding model deployment name (default: text-embedding-3-large)

### Docker Environment Variables

All configuration is now handled through environment variables. The Docker setup automatically reads from your `.env` file:

```bash
# Copy example environment file
cp .env.example .env
# Edit .env with your configuration

# Start with your custom configuration
docker-compose up -d
```

**Important Environment Variables for Docker:**

- `PORT`: Backend port (affects both container and nginx)
- `DB_*`: PostgreSQL configuration (automatically used by postgres service)
- `SECRET_KEY`: Must be set for production
- `DEBUG`: Set to false for production
- `CORS_ORIGINS`: Configure allowed origins for your frontend

## Deployment

### Docker Production Deployment

```bash
# Build production image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### Traditional Deployment

For traditional deployment without Docker:

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

## Troubleshooting

### Connection Refused Error

If you see `ConnectionRefusedError: [Errno 111] Connection refused`, the backend container can't connect to your PostgreSQL/Redis instances:

**Solution 1: Use host.docker.internal (Recommended)**

```bash
# In your .env file:
DB_HOST=host.docker.internal
REDIS_URL=redis://host.docker.internal:6379/0
```

**Solution 2: Use your machine's IP address**

```bash
# Find your machine's IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# In your .env file:
DB_HOST=192.168.1.100  # Replace with your actual IP
REDIS_URL=redis://192.168.1.100:6379/0
```

**Solution 3: Use network mode host (Linux only)**

```bash
# Add to docker-compose.yml under backend service:
network_mode: host
```

### PostgreSQL Connection Issues

Make sure your PostgreSQL configuration allows connections:

1. **Check postgresql.conf:**

   ```
   listen_addresses = '*'  # or 'localhost,host.docker.internal'
   ```

2. **Check pg_hba.conf:**

   ```
   host    all             all             172.17.0.0/16           md5
   ```

3. **Restart PostgreSQL after changes**

### Database Name Mismatch

Make sure your database name in .env matches your actual database:

```bash
# Check your existing database name
psql -h localhost -U postgres -l

# Update .env accordingly
DB_NAME=your_actual_database_name
```

### Quick Test

Test the connection from your host machine first:

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d call_center

# Test Redis connection
redis-cli ping
```

If these work from your host but Docker still fails, the issue is Docker networking.
