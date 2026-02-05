# Call Center Intelligence Platform

A comprehensive platform for analyzing call center data, providing real-time insights, trending topics, and intelligent alerts.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and internationalization
- **Backend**: FastAPI with Python, PostgreSQL, Redis, and Azure OpenAI integration
- **Infrastructure**: Docker Compose with Nginx reverse proxy, unified development environment

## 📁 Project Structure

```
call-center-intelligence/
├── 🐳 docker-compose.yml          # Main Docker configuration
├── 🐳 docker-compose.prod.yml     # Production overrides
├── ⚙️ .env                        # Environment variables
├── 📖 README.md                   # This file
├── 📖 DOCKER_SETUP.md            # Detailed Docker documentation
├── 🛠️ Makefile                   # Convenience commands
├── 📁 call_center_intelligence_backend/  # Python FastAPI backend
├── 📁 call_center_intelligence_frontend/ # Next.js frontend
├── 📁 nginx/                      # Nginx configuration
├── 📁 scripts/                    # Setup and deployment scripts
└── 📁 logs/                       # Application logs
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Make (optional, for convenience commands)

### Development Setup

1. **Clone and setup environment**:

   ```bash
   git clone <repository-url>
   cd call-center-intelligence
   make setup  # Creates .env from .env.example
   ```

2. **Configure environment**:
   Edit `.env` file with your settings:

   ```bash
   # Required: Azure OpenAI credentials
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_api_key_here

   # Optional: Database credentials (defaults work for development)
   DB_PASSWORD=your_secure_password
   SECRET_KEY=your_secret_key_here
   ```

3. **Start development environment**:

   ```bash
   make dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Deployment

1. **Configure production environment**:

   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with production values
   ```

2. **Start production environment**:
   ```bash
   make prod
   ```

## Available Commands

### Development

- `make dev` - Start development environment
- `make dev-build` - Build and start development environment
- `make dev-logs` - Show development logs

### Production

- `make prod` - Start production environment
- `make prod-build` - Build and start production environment
- `make prod-logs` - Show production logs

### Database Management

- `make db-migrate` - Run database migrations
- `make db-seed` - Seed database with sample data
- `make db-reset` - Reset database (WARNING: deletes all data)
- `make backup-db` - Backup database
- `make restore-db BACKUP=filename.sql` - Restore database

### Monitoring & Debugging

- `make status` - Show service status
- `make health` - Check health of all services
- `make logs` - Show logs for all services
- `make shell-backend` - Open shell in backend container
- `make shell-frontend` - Open shell in frontend container
- `make shell-db` - Open PostgreSQL shell

### Cleanup

- `make clean` - Stop and remove containers, networks, volumes
- `make clean-all` - Remove everything including images

## Services

### Frontend (Next.js)

- **Port**: 3000
- **Features**:
  - Twitter-inspired UI design
  - Real-time updates via Server-Sent Events
  - Internationalization (English/Thai)
  - Responsive design with Tailwind CSS

### Backend (FastAPI)

- **Port**: 8000
- **Features**:
  - RESTful API with automatic documentation
  - Real-time WebSocket connections
  - Azure OpenAI integration for embeddings and chat
  - File upload and processing (CSV, Excel)
  - Authentication with JWT tokens

### Database (PostgreSQL)

- **Port**: 5432
- **Features**:
  - Persistent data storage
  - Automatic migrations with Alembic
  - Health checks and backup support

### Cache (Redis)

- **Port**: 6379
- **Features**:
  - Session storage
  - API response caching
  - Real-time data caching

### Reverse Proxy (Nginx)

- **Ports**: 80, 443
- **Features**:
  - Load balancing
  - SSL termination (production)
  - Static file serving
  - Rate limiting

## Environment Variables

### Database

- `DB_HOST` - Database host (default: postgres)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name (default: call_center_db)
- `DB_PORT` - Database port (default: 5432)

### Backend API

- `DEBUG` - Enable debug mode (default: true)
- `PORT` - Backend port (default: 8000)
- `SECRET_KEY` - JWT secret key
- `CORS_ORIGINS` - Allowed CORS origins

### Azure OpenAI

- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_API_VERSION` - API version (default: 2024-12-01-preview)
- `AZURE_EMBEDDING_DEPLOYMENT` - Embedding model deployment name

### Frontend

- `NODE_ENV` - Node environment (development/production)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Development Workflow

1. **Make changes** to frontend or backend code
2. **Hot reload** is enabled in development mode
3. **View logs** with `make logs` or service-specific commands
4. **Test changes** using the web interface or API docs
5. **Debug issues** using shell access or health checks

## Production Considerations

- Use strong passwords and secret keys
- Configure SSL certificates in nginx/ssl/
- Set up proper backup procedures
- Monitor logs and health endpoints
- Use environment-specific .env files
- Consider using Docker secrets for sensitive data

## Troubleshooting

### Common Issues

1. **Services not starting**: Check `make status` and `make logs`
2. **Database connection issues**: Ensure PostgreSQL is healthy
3. **Frontend not loading**: Check if backend is accessible
4. **API errors**: Check backend logs and environment variables

### Health Checks

```bash
# Check all services
make health

# Check individual service logs
make backend-logs
make frontend-logs
make db-logs
```

### Reset Everything

```bash
# Complete reset (WARNING: deletes all data)
make clean
make dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]
