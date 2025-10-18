#!/bin/bash

# Activity Timeline Service Development Startup Script

echo "=== MediLink Activity Timeline Service ==="
echo "Starting development environment..."

# Check if required services are running
echo "Checking prerequisites..."

# Check if Kafka is running
if ! nc -z localhost 9092; then
  echo "❌ Kafka is not running on localhost:9092"
  echo "Please start Kafka first using: docker-compose up kafka"
  exit 1
fi

# Check if MongoDB is running  
if ! nc -z localhost 27017; then
  echo "❌ MongoDB is not running on localhost:27017"
  echo "Please start MongoDB first using: docker-compose up mongo"
  exit 1
fi

# Check if Redis is running
if ! nc -z localhost 6379; then
  echo "❌ Redis is not running on localhost:6379"
  echo "Please start Redis first using: docker-compose up redis"
  exit 1
fi

echo "✅ All prerequisites are running"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.development..."
  cp .env.development .env
fi

echo "Starting Activity Timeline Service in development mode..."
echo "Service will be available at: http://localhost:3006"
echo "API documentation: http://localhost:3006/api/v1/activity/health"
echo ""
echo "Available endpoints:"
echo "  GET /api/v1/activity/timeline - Get activity timeline"
echo "  GET /api/v1/activity/entities/{type}/{id}/activities - Get entity activities"
echo "  GET /api/v1/activity/health - Health check"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

# Start the service
npm run dev