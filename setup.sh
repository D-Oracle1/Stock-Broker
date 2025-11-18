#!/bin/bash

set -e

echo "🚀 Setting up Stock Brokerage Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.template .env
    echo "⚠️  Please edit .env file with your configurations before proceeding."
    echo "Press Enter to continue after editing .env..."
    read
fi

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p uploads/kyc
chmod -R 777 uploads

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec -T backend npm run migration:run || echo "Migrations may have already run"

# Seed database
echo "🌱 Seeding database with initial data..."
docker-compose exec -T backend npm run seed || echo "Database may already be seeded"

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🌐 Access the platform:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""
echo "👤 Default Admin Credentials:"
echo "   Email: admin@stockbroker.com"
echo "   Password: Admin123!"
echo ""
echo "⚠️  IMPORTANT: Change the admin password immediately!"
echo ""
echo "📚 For more information, see README.md and DEPLOYMENT.md"
