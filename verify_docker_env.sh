#!/bin/bash

# Script to verify Docker environment variables are properly configured

echo "🔍 Docker Environment Verification"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in current directory"
    echo "   Please create .env file with Azure OpenAI configuration"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found"
    echo "   Please install Docker Compose"
    exit 1
fi

echo "✅ docker-compose available"
echo ""

# Check Azure OpenAI Chat variables in .env
echo "📋 Checking .env variables:"
echo "----------------------------"

check_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env | cut -d '=' -f2-)
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name: NOT SET"
        return 1
    else
        # Mask sensitive values
        if [[ $var_name == *"KEY"* ]]; then
            echo "✅ $var_name: ${var_value:0:10}...${var_value: -10}"
        else
            echo "✅ $var_name: $var_value"
        fi
        return 0
    fi
}

all_set=true

check_var "AZURE_OPENAI_CHAT_ENDPOINT" || all_set=false
check_var "AZURE_OPENAI_CHAT_API_KEY" || all_set=false
check_var "AZURE_OPENAI_CHAT_API_VERSION" || all_set=false
check_var "AZURE_OPENAI_CHAT_DEPLOYMENT" || all_set=false

echo ""

if [ "$all_set" = false ]; then
    echo "❌ Some variables are missing in .env"
    echo ""
    echo "Please add these to your .env file:"
    echo "AZURE_OPENAI_CHAT_ENDPOINT=https://your-endpoint.openai.azure.com/"
    echo "AZURE_OPENAI_CHAT_API_KEY=your-api-key"
    echo "AZURE_OPENAI_CHAT_API_VERSION=2024-12-01-preview"
    echo "AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-5-mini"
    exit 1
fi

# Check docker-compose config
echo "🐳 Checking docker-compose configuration:"
echo "-------------------------------------------"

if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml is valid"
    
    # Check if variables are passed to container
    if docker-compose config | grep -q "AZURE_OPENAI_CHAT_ENDPOINT"; then
        echo "✅ Azure OpenAI Chat variables configured in docker-compose"
    else
        echo "❌ Azure OpenAI Chat variables NOT found in docker-compose"
        echo "   Please update docker-compose.yml"
        exit 1
    fi
else
    echo "❌ docker-compose.yml has errors"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ All checks passed!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Stop containers:    docker-compose down"
echo "2. Rebuild:            docker-compose build backend"
echo "3. Start:              docker-compose up -d"
echo "4. Check logs:         docker-compose logs -f backend"
echo ""
