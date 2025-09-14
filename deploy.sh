#!/bin/bash

# Production deployment script for FPS-WSS-R1
echo "🚀 Deploying FPS-WSS-R1 to Production"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the project
print_status "Building React frontend..."
npm run build:frontend

if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi

print_success "Frontend build complete"

# Start the production server
print_status "Starting production server..."
print_status "Frontend will be served from: /"
print_status "Socket.IO will be available at: /server"
print_status "Health check at: /health"
echo ""

npm run start:prod
