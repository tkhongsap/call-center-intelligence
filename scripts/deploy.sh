#!/bin/bash

# Call Center Intelligence - Production Deployment Script

set -e

echo "🚀 Call Center Intelligence - Production Deployment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if production .env exists
if [ ! -f .env ]; then
    echo "❌ Production .env file not found."
    echo "Please create .env with production configuration."
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment configuration..."

required_vars=(
    "SECRET_KEY"
    "DB_PASSWORD"
    "AZURE_OPENAI_ENDPOINT"
    "AZURE_OPENAI_API_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
        echo "❌ Required environment variable ${var} is not set in .env"
        exit 1
    fi
done

echo "✅ Environment configuration validated"

# Pull latest images (if using registry)
# echo "📥 Pulling latest images..."
# docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Build and start production services
echo "🔨 Building and starting production services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend python -m alembic upgrade head

# Check service health
echo "🏥 Checking service health..."

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Check Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
    exit 1
fi

# Check Frontend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
    exit 1
fi

# Check Nginx (if enabled)
if docker-compose ps nginx | grep -q "Up"; then
    if curl -s http://localhost/ > /dev/null 2>&1; then
        echo "✅ Nginx is ready"
    else
        echo "❌ Nginx is not ready"
    fi
fi

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📱 Your application is running:"
echo "   Application: http://localhost/"
echo "   Direct Frontend: http://localhost:3000"
echo "   Direct Backend: http://localhost:8000"
echo ""
echo "📊 Monitor your services:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo ""
echo "🔒 Security reminders:"
echo "   - Ensure SSL certificates are configured"
echo "   - Review firewall settings"
echo "   - Set up log rotation"
echo "   - Configure backup procedures"