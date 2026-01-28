#!/usr/bin/env python3
"""
Setup Script for FastAPI Backend

This script sets up the development environment and installs dependencies.
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(command, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True,
            cwd=cwd
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command '{command}': {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return None


def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 9):
        print("Error: Python 3.9 or higher is required")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")


def setup_virtual_environment():
    """Set up Python virtual environment."""
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✓ Virtual environment already exists")
        return
    
    print("Creating virtual environment...")
    result = run_command(f"{sys.executable} -m venv venv")
    if result is not None:
        print("✓ Virtual environment created")
    else:
        print("✗ Failed to create virtual environment")
        sys.exit(1)


def install_dependencies():
    """Install Python dependencies."""
    print("Installing dependencies...")
    
    # Determine pip path based on OS
    if os.name == 'nt':  # Windows
        pip_path = "venv\\Scripts\\pip"
    else:  # Unix/Linux/macOS
        pip_path = "venv/bin/pip"
    
    # Upgrade pip first
    result = run_command(f"{pip_path} install --upgrade pip")
    if result is None:
        print("✗ Failed to upgrade pip")
        sys.exit(1)
    
    # Install requirements
    result = run_command(f"{pip_path} install -r requirements.txt")
    if result is not None:
        print("✓ Dependencies installed successfully")
    else:
        print("✗ Failed to install dependencies")
        sys.exit(1)


def setup_environment_file():
    """Set up environment configuration file."""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if env_file.exists():
        print("✓ Environment file already exists")
        return
    
    if env_example.exists():
        # Copy example to .env
        with open(env_example, 'r') as src, open(env_file, 'w') as dst:
            dst.write(src.read())
        print("✓ Environment file created from example")
    else:
        print("⚠ No .env.example file found, please create .env manually")


def run_tests():
    """Run the test suite to verify setup."""
    print("Running tests to verify setup...")
    
    # Determine python path based on OS
    if os.name == 'nt':  # Windows
        python_path = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        python_path = "venv/bin/python"
    
    result = run_command(f"{python_path} -m pytest tests/test_main.py -v")
    if result is not None:
        print("✓ Basic tests passed")
    else:
        print("⚠ Some tests failed, but setup is complete")


def main():
    """Main setup function."""
    print("Setting up FastAPI Backend Development Environment")
    print("=" * 50)
    
    # Change to backend directory if not already there
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    check_python_version()
    setup_virtual_environment()
    install_dependencies()
    setup_environment_file()
    
    print("\n" + "=" * 50)
    print("Setup completed successfully!")
    print("\nNext steps:")
    print("1. Activate the virtual environment:")
    
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
    
    print("2. Start the development server:")
    print("   python -m uvicorn app.main:app --reload")
    print("3. Open http://localhost:8000/docs to view the API documentation")
    
    # Optionally run tests
    try:
        run_tests()
    except Exception as e:
        print(f"⚠ Could not run tests: {e}")


if __name__ == "__main__":
    main()