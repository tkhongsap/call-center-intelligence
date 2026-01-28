#!/bin/bash

# Setup script for environment variables
# This script helps configure the environment for different deployment scenarios

set -e

echo "FastAPI Backend Environment Setup"
echo "================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

# Function to update environment variable
update_env_var() {
    local key=$1
    local value=$2
    local file=${3:-.env}
    
    if grep -q "^${key}=" "$file"; then
        # Update existing variable
        sed -i.bak "s/^${key}=.*/${key}=${value}/" "$file" && rm "${file}.bak"
    else
        # Add new variable
        echo "${key}=${value}" >> "$file"
    fi
}

# Check for production mode
if [ "$1" = "production" ]; then
    echo ""
    echo "Setting up for PRODUCTION environment..."
    
    # Generate secure secret key
    SECRET_KEY=$(openssl rand -hex 32)
    update_env_var "SECRET_KEY" "$SECRET_KEY"
    echo "✓ Generated secure SECRET_KEY"
    
    # Set production defaults
    update_env_var "DEBUG" "false"
    update_env_var "RELOAD" "false"
    update_env_var "LOG_LEVEL" "WARNING"
    echo "✓ Set production defaults"
    
    echo ""
    echo "⚠️  IMPORTANT: Please update the following in .env:"
    echo "   - DB_PASSWORD: Set a secure database password"
    echo "   - REDIS_PASSWORD: Set a secure Redis password (optional)"
    echo "   - CORS_ORIGINS: Set your production domain(s)"
    echo "   - SERVER_NAME: Set your production domain"
    
elif [ "$1" = "development" ] || [ "$1" = "dev" ]; then
    echo ""
    echo "Setting up for DEVELOPMENT environment..."
    
    # Set development defaults
    update_env_var "DEBUG" "true"
    update_env_var "RELOAD" "true"
    update_env_var "LOG_LEVEL" "INFO"
    echo "✓ Set development defaults"
    
else
    echo ""
    echo "Usage: $0 [development|production]"
    echo ""
    echo "Examples:"
    echo "  $0 development  # Setup for development"
    echo "  $0 production   # Setup for production"
    echo ""
    echo "Current .env file is ready for development by default."
fi

echo ""
echo "Environment setup complete!"
echo "You can now run: make dev"