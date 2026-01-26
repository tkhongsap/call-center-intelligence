# PowerShell setup script for FastAPI backend conda environment on Windows

Write-Host "Creating conda environment for FastAPI backend..." -ForegroundColor Green
conda create -n fastapi-backend python=3.12 -y

Write-Host "Activating conda environment..." -ForegroundColor Green
conda activate fastapi-backend

Write-Host "Installing Python dependencies..." -ForegroundColor Green
pip install -r requirements.txt

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment setup complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To activate the environment, run:" -ForegroundColor Yellow
Write-Host "  conda activate fastapi-backend" -ForegroundColor White
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Yellow
Write-Host "  python start_server.py" -ForegroundColor White
Write-Host ""
Write-Host "To run tests, run:" -ForegroundColor Yellow
Write-Host "  python -m pytest tests/ -v" -ForegroundColor White
Write-Host ""
Write-Host "To deactivate the environment, run:" -ForegroundColor Yellow
Write-Host "  conda deactivate" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"