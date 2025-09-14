#!/bin/bash

# PM2 deployment script for FPS game
echo "🚀 Starting FPS Server with PM2 on localhost:5462"
echo "=================================================="

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PM2. Please install it manually: npm install -g pm2"
        exit 1
    fi
    echo "✅ PM2 installed successfully"
fi

# Build React frontend
echo "Building React frontend..."
cd react
npm run build:prod
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# Stop any existing PM2 process with the same name
echo "Stopping any existing FPS server process..."
pm2 stop fps-server 2>/dev/null || true
pm2 delete fps-server 2>/dev/null || true

# Start the server with PM2
echo "Starting server with PM2..."
cd server
pm2 start server.js --name fps-server --env production -- PORT=5462

# Wait a moment for the server to start
sleep 2

# Check if the process is running
if pm2 list | grep -q "fps-server"; then
    echo "✅ Server started successfully with PM2!"
    echo "📊 PM2 Status:"
    pm2 list | grep fps-server
    echo ""
    echo "🔗 Server running on: http://localhost:5462"
    echo "📡 WebSocket on: ws://localhost:5462/server"
    echo ""
    echo "💡 Useful PM2 commands:"
    echo "  pm2 logs fps-server     # View logs"
    echo "  pm2 stop fps-server     # Stop server"
    echo "  pm2 restart fps-server  # Restart server"
    echo "  pm2 monit              # Monitor all processes"
else
    echo "❌ Failed to start server with PM2"
    exit 1
fi
