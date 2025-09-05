#!/bin/bash

# Multi-Step Agent Test Runner
# Runs all tests for the multi-action handler

echo "=================================="
echo "  Multi-Step Agent Test Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "../../package.json" ]; then
    echo -e "${RED}Error: Must run from server/tests/multi-step-agent directory${NC}"
    exit 1
fi

# Check for required dependencies
echo "Checking environment..."
if [ ! -f "../../.env" ]; then
    echo -e "${YELLOW}Warning: No .env file found. Tests will run in mock mode.${NC}"
    echo ""
fi

# Run unit tests
echo "Running Unit Tests..."
echo "------------------------"
node test-multi-action.js
UNIT_RESULT=$?
echo ""

# Run integration tests
echo "Running Integration Tests..."
echo "------------------------"
node integration-test.js
INTEGRATION_RESULT=$?
echo ""

# Summary
echo "=================================="
echo "         Test Summary"
echo "=================================="

if [ $UNIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit tests: FAILED${NC}"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Integration tests: PASSED${NC}"
else
    echo -e "${RED}❌ Integration tests: FAILED${NC}"
fi

echo ""

# Overall result
if [ $UNIT_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Multi-action handler is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the implementation.${NC}"
    exit 1
fi