#!/bin/bash

# Start the multiplayer FPS server with build
echo "🐰 Building and Starting Multiplayer FPS Server..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the backend (if needed)
print_status "Building backend..."
cd server
npm run build
print_success "Backend build complete"

# Start the server
print_status "Starting server..."
npm start
