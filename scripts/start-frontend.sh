#!/bin/bash

echo "========================================"
echo "Starting CRM Frontend"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Navigate to project root, then to frontend
cd "$SCRIPT_DIR/../frontend" || { echo "❌ Frontend directory not found"; exit 1; }

echo "Checking if node_modules exists..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "✅ Dependencies ready"
echo ""

echo "Starting Next.js development server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""

npm run dev
