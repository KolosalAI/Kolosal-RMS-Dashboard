#!/bin/bash

# Kolosal RMS Dashboard - Docker Build Script

echo "🐳 Building Kolosal RMS Dashboard Docker image..."

# Build the Docker image
docker build -t kolosal-rms-dashboard:latest .

echo "✅ Docker image built successfully!"
echo "🚀 To run the container:"
echo "   docker run -p 3000:3000 kolosal-rms-dashboard:latest"
echo ""
echo "🐙 Or use Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "📱 Access the dashboard at: http://localhost:3000"
