# Windows Commands Reference

This document provides Windows-specific commands for developing the FastAPI backend.

## Environment Setup

### Initial Setup (One-time)

```cmd
# Create conda environment
conda create -n fastapi-backend python=3.12 -y

# Activate environment
conda activate fastapi-backend

# Install dependencies
pip install -r requirements.txt
```

### Daily Development

```cmd
# Activate environment (run this every time you open a new terminal)
conda activate fastapi-backend

# Start development server
python start_server.py

# Or start with uvicorn directly
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing Commands

```cmd
# Make sure environment is activated
conda activate fastapi-backend

# Run all tests
python -m pytest tests/ -v

# Run tests with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test files
python -m pytest tests/test_main.py -v

# Run property-based tests
python -m pytest tests/test_property_*.py -v -s

# Run tests with specific markers
python -m pytest tests/ -m unit -v
python -m pytest tests/ -m integration -v
python -m pytest tests/ -m property -v
```

## Code Quality Commands

```cmd
# Make sure environment is activated
conda activate fastapi-backend

# Format code with Black
python -m black app\ tests\

# Sort imports with isort
python -m isort app\ tests\

# Lint code with flake8
python -m flake8 app\ tests\

# Type checking with mypy
python -m mypy app\

# Run all quality checks at once
python -m black app\ tests\ && python -m isort app\ tests\ && python -m flake8 app\ tests\ && python -m mypy app\
```

## Database Commands

```cmd
# Check database health
python -c "from app.core.database import health_check; import asyncio; print(asyncio.run(health_check()))"

# Run database tests
python -m pytest tests/test_database.py -v

# Run property-based database tests
python -m pytest tests/test_property_database_*.py -v -s
```

## API Testing Commands

```cmd
# Test API health endpoint (requires server to be running)
curl http://localhost:8000/health

# Or using PowerShell
Invoke-RestMethod -Uri http://localhost:8000/health

# Open API documentation in browser
start http://localhost:8000/docs

# Test WebSocket connection (requires additional tools)
# You can use online WebSocket testers or browser developer tools
```

## Docker Commands (Optional)

```cmd
# Build Docker image
docker build -t call-center-backend .

# Run Docker container
docker run -p 8000:8000 call-center-backend

# Use docker-compose
docker-compose up -d

# Stop docker-compose
docker-compose down
```

## Troubleshooting

### Common Issues

1. **Module not found errors**

   ```cmd
   # Make sure conda environment is activated
   conda activate fastapi-backend

   # Reinstall dependencies if needed
   pip install -r requirements.txt
   ```

2. **Port already in use**

   ```cmd
   # Find process using port 8000
   netstat -ano | findstr :8000

   # Kill process by PID (replace XXXX with actual PID)
   taskkill /PID XXXX /F
   ```

3. **Import errors**

   ```cmd
   # Make sure you're in the backend directory
   cd backend

   # Check Python path
   python -c "import sys; print(sys.path)"
   ```

### Environment Management

```cmd
# List conda environments
conda env list

# Remove environment (if needed)
conda env remove -n fastapi-backend

# Export environment
conda env export > environment.yml

# Create from exported environment
conda env create -f environment.yml
```

## IDE Configuration

### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "C:\\Users\\[USERNAME]\\miniconda3\\envs\\fastapi-backend\\python.exe",
  "python.terminal.activateEnvironment": true,
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["tests/"],
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black"
}
```

Replace `[USERNAME]` with your actual Windows username.
