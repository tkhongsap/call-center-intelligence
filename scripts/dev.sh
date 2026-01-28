#!/bin/bash

# Call Center Intelligence - Development Setup Script

set -e

echo "🚀 Call Center Intelligence - Development Setup"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
    echo ""
    echo "⚠️  Important: You need to set your Azure OpenAI credentials:"
    echo "   - AZURE_OPENAI_ENDPOINT"
    echo "   - AZURE_OPENAI_API_KEY"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
fi

# Check Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
fi

# Check Frontend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📊 Monitor your services:"
echo "   docker-compose ps              # Service status"
echo "   docker-compose logs -f         # All logs"
echo "   docker-compose logs -f backend # Backend logs only"
echo "   docker-compose logs -f frontend# Frontend logs only"
echo ""
echo "🛠️  Useful commands:"
echo "   make status    # Check service status"
echo "   make logs      # View all logs"
echo "   make health    # Health check"
echo "   make down      # Stop all services"
echo "   make clean     # Clean up everything"