#!/bin/bash

# CLAWDIS Dashboard - Pre-Deployment Checklist Script
# This script validates that the application is ready for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check functions
check_node_version() {
    section "Checking Node.js Version"
    REQUIRED_VERSION="22.12.0"
    ACTUAL_VERSION=$(node --version | cut -d'v' -f2)
    
    if [[ $(printf '%s\n' "$REQUIRED_VERSION" "$ACTUAL_VERSION" | sort -V | head -n1) == "$REQUIRED_VERSION" ]]; then
        pass "Node.js version $ACTUAL_VERSION (required: >= $REQUIRED_VERSION)"
    else
        fail "Node.js version $ACTUAL_VERSION (required: >= $REQUIRED_VERSION)"
    fi
}

check_package_manager() {
    section "Checking Package Manager"
    
    if ! command -v pnpm &> /dev/null; then
        fail "pnpm not found. Install with: npm install -g pnpm"
    else
        PNPM_VERSION=$(pnpm --version)
        pass "pnpm v$PNPM_VERSION installed"
    fi
}

check_dependencies() {
    section "Checking Dependencies"
    
    if [ ! -d "node_modules" ]; then
        fail "node_modules not found. Run: pnpm install"
    else
        pass "node_modules directory exists"
    fi
}

check_build() {
    section "Building Application"
    
    echo "This will take a minute..."
    if pnpm build > /dev/null 2>&1; then
        pass "Production build successful"
    else
        fail "Production build failed. Run: pnpm build"
    fi
}

check_lint() {
    section "Checking Linting"
    
    if pnpm lint > /dev/null 2>&1; then
        pass "Linting passed"
    else
        warn "Linting has errors. Run: pnpm lint"
    fi
}

check_tests() {
    section "Checking Tests"
    
    if command -v pnpm &> /dev/null && [ -f "jest.config.ts" ] || [ -f "vitest.config.ts" ]; then
        echo "Test configuration found. Consider running: pnpm test"
        warn "Tests should be run before deployment"
    fi
}

check_env_variables() {
    section "Checking Environment Variables"
    
    if [ ! -f ".env.production" ] && [ ! -f ".env.production.example" ]; then
        warn "No .env.production.example found. Create from .env.production.example"
    else
        if [ -f ".env.production.example" ]; then
            pass ".env.production.example exists"
        fi
    fi
    
    # Check for required variables
    REQUIRED_VARS=("NEXT_PUBLIC_GATEWAY_BASE_URL" "NEXT_PUBLIC_GATEWAY_WS_URL" "NEXT_PUBLIC_APP_URL")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env.production 2>/dev/null || grep -q "^$var=" .env.local 2>/dev/null; then
            pass "$var is set"
        else
            warn "$var is not set in .env files (set in deployment platform)"
        fi
    done
}

check_security() {
    section "Checking Security Configuration"
    
    if grep -q "X-Content-Type-Options" middleware.ts; then
        pass "Security headers configured in middleware"
    else
        fail "Security headers missing from middleware"
    fi
    
    if grep -q '"strict": true' tsconfig.json; then
        pass "TypeScript strict mode enabled"
    else
        fail "TypeScript strict mode not enabled"
    fi
    
    if [ -f "public/.well-known/security.txt" ]; then
        pass "security.txt file exists"
    else
        warn "security.txt file missing"
    fi
}

check_files() {
    section "Checking Configuration Files"
    
    FILES=("next.config.mjs" "vercel.json" "Dockerfile.dashboard" ".env.production.example" "app/api/health/route.ts")
    
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            pass "$file exists"
        else
            warn "$file missing"
        fi
    done
}

check_console_logs() {
    section "Checking for Debug Statements"
    
    # Check for debug console.log statements in production code
    if grep -r "console\.log" app/ components/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v ".next"; then
        fail "Found console.log statements in production code"
    else
        pass "No console.log statements found in production code"
    fi
}

check_git() {
    section "Checking Git Status"
    
    if [ -d ".git" ]; then
        pass "Git repository found"
        
        # Check if branch is clean
        if [ -z "$(git status --porcelain)" ]; then
            pass "Working directory is clean"
        else
            warn "Working directory has uncommitted changes"
        fi
    else
        warn "Not a git repository"
    fi
}

check_health_endpoint() {
    section "Checking Health Endpoint"
    
    if grep -q "app/api/health/route.ts" <<< "$(find app/api -name 'route.ts' 2>/dev/null)"; then
        pass "Health endpoint configured"
    else
        warn "Health endpoint not found"
    fi
}

# Main execution
echo ""
echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║${NC}  CLAWDIS Dashboard - Pre-Deployment Verification${NC}${YELLOW}       ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"

# Run all checks
check_node_version
check_package_manager
check_dependencies
check_console_logs
check_env_variables
check_security
check_files
check_git
check_health_endpoint
check_lint

# Build should be last as it's slowest
check_build

# Summary
section "Summary"

echo ""
echo -e "${GREEN}Passed:${NC}   $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
echo -e "${RED}Failed:${NC}   $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for production deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ All critical checks passed, but there are warnings.${NC}"
        echo -e "${YELLOW}  Review the warnings above before deploying.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ $CHECKS_FAILED critical check(s) failed.${NC}"
    echo -e "${RED}  Fix the issues above before deploying.${NC}"
    exit 1
fi
