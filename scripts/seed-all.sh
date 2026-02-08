#!/bin/bash

# Clinical Portal - Seed All Databases
# This script runs all seed scripts in the correct order

set -e  # Exit on error

echo "========================================="
echo "Clinical Portal - Database Seeding"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run seed and check result
run_seed() {
    local service=$1
    local service_path=$2

    echo -e "${BLUE}[INFO]${NC} Seeding ${service}..."

    if cd "${service_path}" 2>/dev/null; then
        if npm run seed 2>&1; then
            echo -e "${GREEN}[SUCCESS]${NC} ${service} seeded successfully"
            cd - > /dev/null
            return 0
        else
            echo -e "${RED}[ERROR]${NC} Failed to seed ${service}"
            cd - > /dev/null
            return 1
        fi
    else
        echo -e "${RED}[ERROR]${NC} Directory not found: ${service_path}"
        return 1
    fi
    echo ""
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Track failures
FAILED_SERVICES=()

# Seed services in order
echo "Step 1/5: Seeding Auth Service (publishes events to sync user-service)..."
if ! run_seed "Auth Service" "apps/auth-service"; then
    FAILED_SERVICES+=("auth-service")
fi

echo "Step 2/5: User Service will auto-sync via RabbitMQ events..."
echo "  ℹ️  Skipping user-service seed (syncs automatically from auth-service)"
echo ""

echo "Step 3/5: Seeding RBAC Service..."
if ! run_seed "RBAC Service" "apps/rbac-service"; then
    FAILED_SERVICES+=("rbac-service")
fi

echo "Step 4/5: Seeding Hospital Service..."
if ! run_seed "Hospital Service" "apps/hospital-service"; then
    FAILED_SERVICES+=("hospital-service")
fi

echo "Step 5/5: Seeding Patient Service..."
if ! run_seed "Patient Service" "apps/patient-service"; then
    FAILED_SERVICES+=("patient-service")
fi

# Summary
echo ""
echo "========================================="
echo "Seeding Complete"
echo "========================================="

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} All services seeded successfully!"
    echo ""
    echo "You can now:"
    echo "  1. Start all services: npm run dev"
    echo "  2. Access the web app: http://localhost:3100"
    echo "  3. Login with: admin@clinical-portal.com / Admin123!"
    exit 0
else
    echo -e "${RED}[WARNING]${NC} Some services failed to seed:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    echo "Please check the error messages above and retry failed services manually."
    exit 1
fi
