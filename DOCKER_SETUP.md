# Docker Setup Guide

This document explains the Docker-based infrastructure setup for the Call Center Intelligence platform.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │     Backend     │
│  (Port 80/443)  │◄──►│   (Port 3000)   │◄──►│   (Port 8000)   │
│  Reverse Proxy  │    │    Next.js      │    │    FastAPI      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │   PostgreSQL    │
                       │   (Port 6379)   │    │   (Port 5432)   │
                       │     Cache       │    │    Database     │
                       └─────────────────┘    └─────────────────┘
```

## File Structure

```
call-center-intelligence/
├── docker-compose.yml              # Main Docker Compose configuration
├── docker-compose.prod.yml         # Production overrides
├── .env                           # Centralized environment variables
├── .env.example                   # Environment template
├── Makefile                       # Convenience commands
├── README.md                      # Main documentation
├── DOCKER_SETUP.md               # This file
├── .dockerignore                  # Docker ignore patterns
├── .gitignore                     # Git ignore patterns
│
├── call_center_intelligence_backend/
│   ├── Dockerfile                 # Backend container definition
│   ├── requirements.txt           # Python dependencies
│   ├── main.py                   # FastAPI application entry point
│   ├── Makefile                  # Backend-specific commands
│   └── ...                       # Backend source code
│
├── call_center_intelligence_frontend/
│   ├── Dockerfile                 # Frontend container definition
│   ├── package.json              # Node.js dependencies
│   ├── next.config.ts            # Next.js configuration
│   └── ...                       # Frontend source code
│
├── nginx/
│   ├── nginx.conf.template        # Nginx configuration template
│   └── ssl/                      # SSL certificates (create for production)
│
├── init-scripts/
│   └── 01-init-database.sql      # Database initialization
│
├── scripts/
│   ├── dev.sh                    # Development setup script (Linux/Mac)
│   ├── dev.bat                   # Development setup script (Windows)
│   └── deploy.sh                 # Production deployment script
│
└── logs/                         # Application logs
    ├── .gitkeep
    ├── nginx/                    # Nginx logs
    └── ...                       # Other service logs
```

## Services

### 1. PostgreSQL Database

- **Image**: `postgres:16-alpine`
- **Port**: 5432
- **Volume**: `postgres_data:/var/lib/postgresql/data`
- **Health Check**: `pg_isready`
- **Initialization**: Scripts in `init-scripts/` run on first start

### 2. Redis Cache

- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Volume**: `redis_data:/data`
- **Health Check**: `redis-cli ping`
- **Usage**: Session storage, API caching

### 3. Backend (FastAPI)

- **Build Context**: `./call_center_intelligence_backend`
- **Port**: 8000
- **Health Check**: `curl http://localhost:8000/health`
- **Dependencies**: PostgreSQL, Redis
- **Features**: REST API, WebSocket, Azure OpenAI integration

### 4. Frontend (Next.js)

- **Build Context**: `./call_center_intelligence_frontend`
- **Port**: 3000
- **Health Check**: `curl http://localhost:3000/api/health`
- **Dependencies**: Backend
- **Features**: SSR, Real-time updates, Internationalization

### 5. Nginx (Production)

- **Image**: `nginx:alpine`
- **Ports**: 80, 443
- **Profile**: `production` (disabled in development)
- **Features**: Reverse proxy, SSL termination, Static file serving

## Environment Configuration

### Centralized Configuration

All environment variables are now managed from a single `.env` file in the project root. This simplifies configuration management and ensures consistency across all services.

**Key Benefits:**

- Single source of truth for all configuration
- No duplicate environment files
- Easier deployment and maintenance
- Consistent variable names across services

### Development (.env)

```bash
# Database
DB_PASSWORD=password
DB_NAME=call_center_db

# API
DEBUG=true
SECRET_KEY=dev-secret-key

# Azure OpenAI (required)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
```

### Production (.env)

```bash
# Database
DB_PASSWORD=secure_production_password
DB_NAME=call_center_db

# API
DEBUG=false
SECRET_KEY=super_secure_production_key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_production_api_key

# Security
CORS_ORIGINS=https://yourdomain.com
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## Quick Start Commands

### Development

```bash
# Setup (first time)
make setup          # Creates .env from template
# Edit .env with your configuration

# Start development environment
make dev            # Start all services
make dev-build      # Build and start
make dev-logs       # View logs

# Individual services
make backend-logs   # Backend logs only
make frontend-logs  # Frontend logs only
make db-logs        # Database logs only
```

### Production

```bash
# Deploy to production
make prod           # Start production environment
make prod-build     # Build and start production
make prod-logs      # View production logs
```

### Database Management

```bash
make db-migrate     # Run migrations
make db-seed        # Seed with sample data
make db-reset       # Reset database (WARNING: deletes data)
make backup-db      # Create database backup
```

### Monitoring

```bash
make status         # Service status
make health         # Health checks
make logs           # All service logs
```

### Cleanup

```bash
make down           # Stop services
make clean          # Remove containers and volumes
make clean-all      # Remove everything including images
```

## Development Workflow

1. **Initial Setup**:

   ```bash
   git clone <repository>
   cd call-center-intelligence
   make setup
   # Edit .env with your Azure OpenAI credentials
   make dev
   ```

2. **Daily Development**:
   - Code changes are automatically reflected (hot reload)
   - View logs: `make logs`
   - Check status: `make status`
   - Access apps: Frontend (3000), Backend (8000), Docs (8000/docs)

3. **Database Changes**:
   - Create migration: `docker-compose exec backend alembic revision --autogenerate -m "description"`
   - Apply migration: `make db-migrate`
   - Reset if needed: `make db-reset`

4. **Debugging**:
   - Shell access: `make shell-backend`, `make shell-frontend`, `make shell-db`
   - Service logs: `make backend-logs`, `make frontend-logs`
   - Health check: `make health`

## Production Deployment

### Prerequisites

1. Server with Docker and Docker Compose
2. Domain name and SSL certificates
3. Production environment variables

### Deployment Steps

1. **Prepare Environment**:

   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **SSL Setup** (optional):

   ```bash
   mkdir -p nginx/ssl
   # Copy your SSL certificates to nginx/ssl/
   ```

3. **Deploy**:

   ```bash
   make prod-build
   ```

4. **Verify**:
   ```bash
   make health
   make status
   ```

### Production Considerations

- Use strong passwords and secret keys
- Configure SSL certificates
- Set up log rotation
- Implement backup procedures
- Monitor resource usage
- Configure firewall rules

## Troubleshooting

### Common Issues

1. **Services won't start**:

   ```bash
   make status          # Check service status
   make logs           # Check error logs
   docker system prune # Clean up if needed
   ```

2. **Database connection errors**:

   ```bash
   make db-logs        # Check PostgreSQL logs
   make shell-db       # Test database connection
   ```

3. **Frontend/Backend communication issues**:
   - Check CORS_ORIGINS in .env
   - Verify NEXT_PUBLIC_API_URL
   - Check network connectivity between containers

4. **Port conflicts**:
   - Change ports in .env file
   - Check for other services using the same ports

5. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER logs/
   ```

### Health Checks

Each service has health checks that can help diagnose issues:

- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Backend: `curl http://localhost:8000/health`
- Frontend: `curl http://localhost:3000/api/health`

### Log Locations

- Application logs: `./logs/`
- Container logs: `docker-compose logs <service>`
- Nginx logs: `./logs/nginx/` (in production)

## Security Best Practices

1. **Environment Variables**:
   - Never commit .env files
   - Use strong, unique passwords
   - Rotate secrets regularly

2. **Network Security**:
   - Use internal Docker networks
   - Expose only necessary ports
   - Configure firewall rules

3. **SSL/TLS**:
   - Use HTTPS in production
   - Configure proper SSL certificates
   - Enable HSTS headers

4. **Database Security**:
   - Use strong database passwords
   - Limit database access
   - Regular backups

5. **Container Security**:
   - Use non-root users in containers
   - Keep images updated
   - Scan for vulnerabilities

## Performance Optimization

1. **Database**:
   - Configure PostgreSQL for your workload
   - Set up connection pooling
   - Monitor query performance

2. **Caching**:
   - Configure Redis appropriately
   - Implement application-level caching
   - Use CDN for static assets

3. **Frontend**:
   - Enable Next.js optimizations
   - Configure proper caching headers
   - Optimize images and assets

4. **Backend**:
   - Use async/await properly
   - Implement request caching
   - Monitor API performance

## Backup and Recovery

### Database Backup

```bash
# Automated backup
make backup-db

# Manual backup
docker-compose exec postgres pg_dump -U postgres call_center_db > backup.sql

# Restore
make restore-db BACKUP=backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Restore volumes
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
```

## Monitoring and Logging

### Log Management

- Logs are stored in `./logs/` directory
- Configure log rotation for production
- Use centralized logging for multiple servers

### Monitoring

- Health check endpoints available
- Monitor resource usage with `docker stats`
- Set up alerts for service failures

### Metrics

- Backend metrics: `/metrics` endpoint (if configured)
- Database metrics: PostgreSQL stats
- System metrics: Docker and host monitoring
