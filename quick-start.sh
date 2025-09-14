#!/bin/bash

# Quick start script for FPS-WSS-R1
echo "🚀 Starting FPS-WSS-R1"
echo "======================"

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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    print_status "Installing server dependencies..."
    npm run install:server
fi

# Build the project
print_status "Building project..."
npm run build:all

print_success "Build complete!"

# Start the production server
print_status "Starting production server..."
print_status "Frontend: http://localhost:5642 (served by backend)"
print_status "Backend: ws://localhost:5642/server (Socket.IO)"
print_status "Health check: http://localhost:5642/health"
echo ""

npm run start:prod
