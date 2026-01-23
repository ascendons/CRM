#!/bin/bash

echo "========================================"
echo "Starting CRM Frontend"
echo "========================================"
echo ""

cd frontend

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
