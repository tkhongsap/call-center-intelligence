#!/bin/bash

# Startup script for FastAPI backend with environment validation

echo "🚀 Starting Call Center Intelligence Backend"
echo "=============================================="

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in project root"
    echo "   Expected location: ../env"
    exit 1
fi

echo "✅ Found .env file"

# Check environment variables
echo ""
echo "🔍 Checking environment variables..."
python check_env.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Environment check failed"
    exit 1
fi

echo ""
echo "=============================================="
echo "🎯 Starting server..."
echo "=============================================="
echo ""

# Start the server
python main.py --debug

