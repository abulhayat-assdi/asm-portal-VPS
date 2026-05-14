#!/bin/bash

# ASM Internal Portal Deployment Script
# This script builds and starts the application using Docker Compose.

echo "🚀 Starting Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Pull latest changes (optional, uncomment if using git on VPS)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Build and start the containers
echo "🏗️ Building and starting containers..."
docker compose up -d --build

# Run Prisma Migrations
echo "🗄️ Running database migrations..."
docker compose exec app npx prisma migrate deploy

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be running at http://localhost:3000"
