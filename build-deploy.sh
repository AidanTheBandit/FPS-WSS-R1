#!/bin/bash

# Rabbit-Raycast Build and Deployment Script
# This script helps build and deploy the raycasting demo

set -e  # Exit on any error

echo "🐰 Rabbit-Raycast Build Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
    print_error "package.json not found. Please run this script from the apps/app directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to build the project
build_project() {
    print_status "Building project for production..."

    # Clean previous build
    if [ -d "dist" ]; then
        print_status "Cleaning previous build..."
        rm -rf dist
    fi

    # Build the project
    if npm run build; then
        print_success "Build completed successfully"

        # Show build stats
        if [ -d "dist" ]; then
            BUILD_SIZE=$(du -sh dist | cut -f1)
            FILE_COUNT=$(find dist -type f | wc -l)
            print_status "Build size: $BUILD_SIZE"
            print_status "Files generated: $FILE_COUNT"

            # List generated files
            echo "Generated files:"
            find dist -type f -exec ls -lh {} \; | awk '{print "  " $9 " (" $5 ")"}'
        fi
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    PACKAGE_NAME="rabbit-raycast_$TIMESTAMP"

    # Create deployment directory
    mkdir -p "../deploy/$PACKAGE_NAME"

    # Copy built files
    cp -r dist/* "../deploy/$PACKAGE_NAME/"

    # Copy additional files for deployment
    cp "../README.md" "../deploy/$PACKAGE_NAME/" 2>/dev/null || true
    cp "../TECHNICAL.md" "../deploy/$PACKAGE_NAME/" 2>/dev/null || true
    cp "../API.md" "../deploy/$PACKAGE_NAME/" 2>/dev/null || true
    cp "../DEVELOPMENT.md" "../deploy/$PACKAGE_NAME/" 2>/dev/null || true

    # Create deployment info file
    cat > "../deploy/$PACKAGE_NAME/deployment-info.txt" << EOF
Rabbit-Raycast Deployment Package
=================================

Build Date: $(date)
Version: $(node -p "require('./package.json').version")
Node.js: $(node --version)
npm: $(npm --version)

Files:
$(find "../deploy/$PACKAGE_NAME" -type f | wc -l) files
Size: $(du -sh "../deploy/$PACKAGE_NAME" | cut -f1)

To deploy:
1. Copy the contents of this directory to your web server
2. Ensure the server serves index.html as the default file
3. For R1 device deployment, copy to the device's webview directory

Main files:
- index.html (entry point)
- assets/ (compiled JavaScript and CSS)
EOF

    # Create zip archive
    cd "../deploy"
    if command -v zip &> /dev/null; then
        zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME"
        print_success "Deployment package created: deploy/$PACKAGE_NAME.zip"
    else
        print_warning "zip command not found. Package created in deploy/$PACKAGE_NAME/"
    fi

    cd - > /dev/null
}

# Function to start development server
start_dev_server() {
    print_status "Starting development server..."
    print_status "Press Ctrl+C to stop the server"
    npm run dev
}

# Function to run preview server
start_preview_server() {
    print_status "Starting preview server..."
    print_status "Press Ctrl+C to stop the server"
    npm run preview
}

# Function to show help
show_help() {
    echo "Rabbit-Raycast Build Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install    Install dependencies"
    echo "  build      Build for production"
    echo "  deploy     Build and create deployment package"
    echo "  dev        Start development server"
    echo "  preview    Start preview server for built files"
    echo "  clean      Clean build artifacts"
    echo "  all        Install deps, build, and create deployment"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build          # Build the project"
    echo "  $0 deploy         # Build and create deployment package"
    echo "  $0 dev            # Start development server"
}

# Main script logic
case "${1:-all}" in
    "install")
        install_deps
        ;;
    "build")
        build_project
        ;;
    "deploy")
        install_deps
        build_project
        create_deployment_package
        ;;
    "dev")
        start_dev_server
        ;;
    "preview")
        build_project
        start_preview_server
        ;;
    "clean")
        print_status "Cleaning build artifacts..."
        rm -rf dist
        rm -rf ../deploy
        print_success "Cleaned"
        ;;
    "all")
        install_deps
        build_project
        create_deployment_package
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

print_success "Script completed successfully! 🎮"
