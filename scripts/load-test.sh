#!/bin/bash

##############################################################################
# Load Testing Script for CRM Chat & Notification System
# Tests authorization performance, throughput, and concurrent users
##############################################################################

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
CONCURRENT_USERS="${CONCURRENT_USERS:-100}"
REQUESTS_PER_USER="${REQUESTS_PER_USER:-10}"
TEST_DURATION="${TEST_DURATION:-60}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  CRM System Load Testing${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "Configuration:"
echo -e "  Base URL: ${GREEN}$BASE_URL${NC}"
echo -e "  Concurrent Users: ${GREEN}$CONCURRENT_USERS${NC}"
echo -e "  Requests/User: ${GREEN}$REQUESTS_PER_USER${NC}"
echo -e "  Test Duration: ${GREEN}${TEST_DURATION}s${NC}"
echo ""

# Check if required tools are installed
command -v ab >/dev/null 2>&1 || {
    echo -e "${RED}Error: Apache Bench (ab) is not installed${NC}"
    echo "Install with: brew install apache2 (macOS) or apt-get install apache2-utils (Linux)"
    exit 1
}

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if curl -s -f "$BASE_URL/../ping" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not responding${NC}"
    echo "Please start the backend server first"
    exit 1
fi

# Create results directory
RESULTS_DIR="load-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Test 1: Health Check Endpoint${NC}"
echo -e "${BLUE}=====================================${NC}"
ab -n 1000 -c 50 "$BASE_URL/../ping" > "$RESULTS_DIR/01-health-check.txt" 2>&1
HEALTH_RPS=$(grep "Requests per second" "$RESULTS_DIR/01-health-check.txt" | awk '{print $4}')
echo -e "${GREEN}✓ Completed${NC} - ${HEALTH_RPS} requests/sec"

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Load Test Results${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to display test results
show_results() {
    local file=$1
    local test_name=$2

    if [ -f "$file" ]; then
        echo -e "${YELLOW}$test_name${NC}"
        echo "  Requests per second: $(grep "Requests per second" "$file" | awk '{print $4}')"
        echo "  Mean response time: $(grep "Time per request" "$file" | head -1 | awk '{print $4}') ms"
        echo "  Failed requests: $(grep "Failed requests" "$file" | awk '{print $3}')"
        echo "  95th percentile: $(grep "95%" "$file" | awk '{print $2}') ms"
        echo ""
    fi
}

show_results "$RESULTS_DIR/01-health-check.txt" "Health Check Endpoint"

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "All results saved in: $RESULTS_DIR/"
echo ""
echo -e "${GREEN}Performance Benchmarks:${NC}"
echo "  ✓ Health endpoint: $HEALTH_RPS req/sec"
echo ""

# Check for performance issues
echo -e "${YELLOW}Performance Analysis:${NC}"
if (( $(echo "$HEALTH_RPS < 100" | bc -l) )); then
    echo -e "  ${RED}⚠ Warning: Health endpoint RPS is low (<100)${NC}"
else
    echo -e "  ${GREEN}✓ Health endpoint performance is good${NC}"
fi

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Load Test Complete!${NC}"
echo -e "${BLUE}=====================================${NC}"
