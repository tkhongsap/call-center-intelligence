@echo off
REM Setup script for FastAPI backend conda environment on Windows

echo Creating conda environment for FastAPI backend...
conda create -n fastapi-backend python=3.12 -y

echo Activating conda environment...
call conda activate fastapi-backend

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo ========================================
echo Environment setup complete!
echo ========================================
echo.
echo To activate the environment, run:
echo   conda activate fastapi-backend
echo.
echo To start the development server, run:
echo   python start_server.py
echo.
echo To run tests, run:
echo   python -m pytest tests/ -v
echo.
echo To deactivate the environment, run:
echo   conda deactivate
echo.

pause