#!/bin/bash

# Quick start script for FP# Build the project
print_status "Building project..."
npm run build:all

print_success "Build complete!"

# Start with tunnels
print_status "Starting production server with Cloudflare tunnel..."
print_status "Frontend: http://localhost:5642 (served by backend)"
print_status "Backend: ws://localhost:5642/server (Socket.IO)"
echo ""
print_warning "Cloudflare tunnel URL will be displayed below:"
echo ""

npm run tunnel:serverCloudflare tunneling
echo "🚀 Starting FPS-WSS-R1 with Cloudflare Tunnels"
echo "=============================================="

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

# Start with tunnels
print_status "Starting servers with Cloudflare tunnels..."
print_status "Frontend & Backend: http://localhost:5642 (same domain/port, Socket.IO on /server)"
echo ""
print_warning "Cloudflare tunnel URLs will be displayed below:"
echo ""

npm run tunnel:prod
