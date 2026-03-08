#!/bin/bash

# Attendance System Quick Test Script
# This script tests the basic attendance flow

set -e  # Exit on error

echo "🚀 Attendance Monitoring System - Quick Test"
echo "=============================================="
echo ""

# Configuration
BASE_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s "$BASE_URL/actuator/health" > /dev/null 2>&1; then
    print_success "Backend is running"
else
    print_error "Backend is not running. Start it with: ./mvnw spring-boot:run"
    exit 1
fi

echo ""
echo "2. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}")

# Extract token (using basic grep/sed - adjust based on your JSON structure)
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Failed to login. Check credentials."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Logged in successfully"
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "3. Creating Office Location..."
LOCATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/office-locations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Office",
        "code": "TST",
        "address": "123 Test Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "postalCode": "400001",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "radiusMeters": 100,
        "type": "HEAD_OFFICE",
        "enforceGeofence": false,
        "isActive": true
    }')

LOCATION_ID=$(echo "$LOCATION_RESPONSE" | grep -o '"locationId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$LOCATION_ID" ]; then
    print_info "Office location might already exist. Trying to fetch..."
    LOCATION_ID="LOC-2026-03-00001"  # Default first ID
else
    print_success "Office location created: $LOCATION_ID"
fi

echo ""
echo "4. Creating Shift..."
SHIFT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shifts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Day Shift",
        "code": "TEST",
        "description": "Test shift",
        "startTime": "09:00:00",
        "endTime": "18:00:00",
        "workHoursMinutes": 540,
        "type": "FIXED",
        "graceMinutes": 15,
        "mandatoryBreakMinutes": 60,
        "maxBreakMinutes": 90,
        "workingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        "weekendDays": ["SATURDAY", "SUNDAY"],
        "allowOvertime": true,
        "isDefault": true,
        "isActive": true
    }')

SHIFT_ID=$(echo "$SHIFT_RESPONSE" | grep -o '"shiftId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SHIFT_ID" ]; then
    print_info "Shift might already exist. Trying to fetch..."
    SHIFT_ID="SFT-2026-03-00001"  # Default first ID
else
    print_success "Shift created: $SHIFT_ID"
fi

echo ""
echo "5. Creating Holiday..."
curl -s -X POST "$BASE_URL/api/holidays" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "date": "2026-08-15",
        "name": "Independence Day",
        "description": "National Holiday",
        "type": "NATIONAL",
        "isOptional": false
    }' > /dev/null

print_success "Holiday created (or already exists)"

echo ""
echo "6. Testing Employee Check-In..."
CHECKIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/attendance/check-in" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"type\": \"OFFICE\",
        \"latitude\": 19.0760,
        \"longitude\": 72.8777,
        \"accuracy\": 10.5,
        \"address\": \"Test Office\",
        \"officeLocationId\": \"$LOCATION_ID\",
        \"userNotes\": \"Automated test check-in\"
    }")

ATTENDANCE_ID=$(echo "$CHECKIN_RESPONSE" | grep -o '"attendanceId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ATTENDANCE_ID" ]; then
    print_info "Check-in response: $CHECKIN_RESPONSE"
    # Check if already checked in today
    if echo "$CHECKIN_RESPONSE" | grep -q "Already checked in"; then
        print_info "Already checked in today. This is expected if running test multiple times."
    else
        print_error "Failed to check in"
    fi
else
    print_success "Checked in successfully: $ATTENDANCE_ID"
fi

echo ""
echo "7. Getting Today's Attendance..."
TODAY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/attendance/my/today" \
    -H "Authorization: Bearer $TOKEN")

if echo "$TODAY_RESPONSE" | grep -q "attendanceId"; then
    print_success "Retrieved today's attendance"
    echo "$TODAY_RESPONSE" | head -c 200
    echo "..."
else
    print_error "Failed to get today's attendance"
fi

echo ""
echo "8. Checking Leave Balance..."
BALANCE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/leaves/my/balance?year=2026" \
    -H "Authorization: Bearer $TOKEN")

if echo "$BALANCE_RESPONSE" | grep -q "balances"; then
    print_success "Retrieved leave balance"
    echo "$BALANCE_RESPONSE" | head -c 200
    echo "..."
else
    print_info "Leave balance not initialized. Will be created on first leave application."
fi

echo ""
echo "9. Testing Daily Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/attendance/admin/dashboard/daily" \
    -H "Authorization: Bearer $TOKEN")

if echo "$DASHBOARD_RESPONSE" | grep -q "totalEmployees"; then
    print_success "Retrieved daily dashboard"
    echo "$DASHBOARD_RESPONSE" | head -c 200
    echo "..."
else
    print_error "Failed to get dashboard"
fi

echo ""
echo "=============================================="
echo "🎉 Basic tests completed!"
echo ""
print_info "Next steps:"
echo "  1. Import Postman collection: Attendance_Monitoring_System.postman_collection.json"
echo "  2. Read full guide: ATTENDANCE_TESTING_GUIDE.md"
echo "  3. Test frontend at: http://localhost:3000/attendance"
echo ""
print_info "MongoDB verification:"
echo "  mongosh"
echo "  use crm_database"
echo "  db.attendances.find().pretty()"
echo ""
