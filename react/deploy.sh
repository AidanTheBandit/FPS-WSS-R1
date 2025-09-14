#!/bin/bash

# Rabbit-Raycast Vercel Deployment Script
# This script builds and deploys the React app to Vercel

echo "🚀 Building Rabbit-Raycast for production..."
npm run build:prod

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Deploying to Vercel..."
    npm run deploy
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi
