#!/bin/bash

echo "========================================"
echo "Starting CRM Backend"
echo "========================================"
echo ""

cd backend

echo "Checking MongoDB status..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running!"
    echo "Starting MongoDB..."
    brew services start mongodb-community 2>/dev/null || mongod --config /usr/local/etc/mongod.conf &
    sleep 3
fi

echo "✅ MongoDB is running"
echo ""

echo "Starting Spring Boot application..."
echo "Backend will be available at: http://localhost:8080"
echo ""

./mvnw spring-boot:run
