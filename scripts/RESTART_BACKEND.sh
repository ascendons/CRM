#!/bin/bash

echo "🔄 Restarting Backend with new file upload limits..."
echo ""
echo "📋 Changes Applied:"
echo "   - Max file size: 50MB"
echo "   - Max request size: 50MB"
echo ""

cd backend

# Kill any running Spring Boot process
echo "🛑 Stopping any running backend processes..."
pkill -f "spring-boot:run" 2>/dev/null || true
sleep 2

# Start the backend
echo "🚀 Starting backend..."
./mvnw spring-boot:run &

echo ""
echo "⏳ Backend starting on http://localhost:8080"
echo "   Wait ~10 seconds for startup to complete"
echo ""
echo "✅ You can now upload PDFs up to 50MB"
echo ""
echo "Test with:"
echo "   curl http://localhost:8080/api/v1/zoloto/health"
