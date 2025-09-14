#!/bin/bash

# Quick start script for FPS-WSS-R1 with Cloudflare tunneling
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

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    print_error "cloudflared is not installed. Please install it first:"
    echo "  brew install cloudflared"
    echo "  or visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/"
    exit 1
fi

# Check if logged in to cloudflared
print_status "Checking Cloudflare authentication..."
if ! cloudflared tunnel list &> /dev/null; then
    print_warning "Not logged in to Cloudflare. Please run:"
    echo "  cloudflared tunnel login"
    exit 1
fi

print_success "Cloudflare authentication confirmed"

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
print_status "Frontend: http://localhost:5173 (dev) / http://localhost:4173 (prod)"
print_status "Backend: http://localhost:3001"
echo ""
print_warning "Cloudflare tunnel URLs will be displayed below:"
echo ""

npm run tunnel:prod
