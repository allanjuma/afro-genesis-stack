
#!/bin/bash

# Afro Network Docker Stack Setup Script
# This script sets up the complete Afro blockchain infrastructure

set -e

echo "🚀 Setting up Afro Network Docker Stack..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Afro Network Configuration
NETWORK_ID=7878
CHAIN_ID=7878
COIN=AFRO
COIN_NAME=Afro
NETWORK_NAME=Afro Network
SUBNETWORK=Afro Mainnet

# Database Configuration
POSTGRES_DB=blockscout
POSTGRES_USER=blockscout
POSTGRES_PASSWORD=blockscout_password

# Explorer Configuration
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://afro-validator:8545
ETHEREUM_JSONRPC_WS_URL=ws://afro-validator:8546

# Ports (modify if needed)
VALIDATOR_HTTP_PORT=8545
VALIDATOR_WS_PORT=8546
VALIDATOR_P2P_PORT=30303
EXPLORER_PORT=4000
WEB_PORT=80
EOF
    echo "✅ .env file created"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true

# Build and start the stack
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting Afro Network stack..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check validator
if curl -s http://localhost:8545 > /dev/null; then
    echo "✅ Validator node is running (http://localhost:8545)"
else
    echo "⚠️  Validator node is not responding yet"
fi

# Check explorer
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Explorer is running (http://localhost:4000)"
else
    echo "⚠️  Explorer is not responding yet (may take a few minutes to start)"
fi

# Check web frontend
if curl -s http://localhost:80 > /dev/null; then
    echo "✅ Web frontend is running (http://localhost:80)"
else
    echo "⚠️  Web frontend is not responding yet"
fi

echo ""
echo "🎉 Afro Network setup complete!"
echo ""
echo "📋 Service URLs:"
echo "   • Web Frontend: http://localhost"
echo "   • Block Explorer: http://localhost:4000"
echo "   • RPC Endpoint: http://localhost:8545"
echo "   • WebSocket: ws://localhost:8546"
echo ""
echo "🔧 MetaMask Configuration:"
echo "   • Network Name: Afro Network"
echo "   • RPC URL: http://localhost:8545"
echo "   • Chain ID: 7878"
echo "   • Currency: AFRO"
echo "   • Explorer: http://localhost:4000"
echo ""
echo "📖 Next Steps:"
echo "   1. Visit http://localhost to see the landing page"
echo "   2. Click 'Add to MetaMask' to configure your wallet"
echo "   3. Explore the blockchain at http://localhost:4000"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo "   • Update: docker-compose pull && docker-compose up -d"
echo ""
echo "Enjoy your Afro Network! 🌍"
