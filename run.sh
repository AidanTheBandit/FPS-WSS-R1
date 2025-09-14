#!/bin/bash

# Simple deployment script for FPS game
echo "🚀 Starting FPS Server on localhost:5462"
echo "========================================"

# Build React frontend
echo "Building React frontend..."
cd react
npm run build:prod
cd ..

# Start the server
echo "Starting server..."
cd server
NODE_ENV=production node server.js
