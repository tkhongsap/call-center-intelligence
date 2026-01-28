@echo off
echo 🚀 Call Center Intelligence - Development Setup
echo ==============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ Created .env file. Please edit it with your configuration.
    echo.
    echo ⚠️  Important: You need to set your Azure OpenAI credentials:
    echo    - AZURE_OPENAI_ENDPOINT
    echo    - AZURE_OPENAI_API_KEY
    echo.
    pause
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo 🏥 Checking service health...

REM Check services (simplified for Windows)
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend is not ready
) else (
    echo ✅ Backend is ready
)

curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend is not ready
) else (
    echo ✅ Frontend is ready
)

echo.
echo 🎉 Development environment is ready!
echo.
echo 📱 Access your application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo 📊 Monitor your services:
echo    docker-compose ps              # Service status
echo    docker-compose logs -f         # All logs
echo    docker-compose logs -f backend # Backend logs only
echo    docker-compose logs -f frontend# Frontend logs only
echo.
echo 🛠️  Useful commands:
echo    make status    # Check service status
echo    make logs      # View all logs
echo    make health    # Health check
echo    make down      # Stop all services
echo    make clean     # Clean up everything

pause