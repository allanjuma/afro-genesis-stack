#!/bin/bash

# Afro Network Docker Stack Setup Script
# This script sets up the complete Afro blockchain infrastructure

set -e

# Parse command line arguments
APPIMAGE_ONLY=false
for arg in "$@"; do
    case $arg in
        --appimage-only)
            APPIMAGE_ONLY=true
            shift
            ;;
        *)
            # Unknown option
            ;;
    esac
done

if [ "$APPIMAGE_ONLY" = true ]; then
    echo "🚀 Building Afro Network AppImage only..."
    
    # Check if AppImageTool is available
    if ! command -v appimagetool &> /dev/null; then
        echo "❌ AppImageTool is not installed. Installing..."
        
        # Download AppImageTool
        wget -O appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
        chmod +x appimagetool
        sudo mv appimagetool /usr/local/bin/
        
        echo "✅ AppImageTool installed successfully"
    fi
    
    # Create AppImage directory structure
    echo "📁 Creating AppImage directory structure..."
    mkdir -p AppDir/usr/bin
    mkdir -p AppDir/usr/share/applications
    mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
    
    # Copy application files
    echo "📄 Copying application files..."
    
    # Create the main executable script
    cat > AppDir/usr/bin/afro-network << 'EOF'
#!/bin/bash
APPDIR="$(dirname "$(readlink -f "${0}")")/.."
export PATH="${APPDIR}/usr/bin:${PATH}"

# Start the React dashboard
cd "${APPDIR}"
if [ -f "dist/index.html" ]; then
    python3 -m http.server 8080 -d dist &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:8080 &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser http://localhost:8080 &
    else
        echo "Dashboard available at: http://localhost:8080"
    fi
    
    # Keep the server running
    wait $SERVER_PID
else
    echo "Dashboard files not found. Please build the project first."
    exit 1
fi
EOF
    chmod +x AppDir/usr/bin/afro-network
    
    # Create desktop file
    cat > AppDir/usr/share/applications/afro-network.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Afro Network
Comment=Afro Network Validator Dashboard
Exec=afro-network
Icon=afro-network
Categories=Development;Network;
StartupNotify=true
EOF
    
    # Copy icon (use a default if afro logo not available)
    if [ -f "web/site/images/afro-logo.png" ]; then
        cp web/site/images/afro-logo.png AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png
    else
        # Create a simple placeholder icon
        echo "⚠️  Afro logo not found, creating placeholder icon"
        convert -size 256x256 xc:orange -fill white -gravity center -pointsize 48 -annotate +0+0 "AFRO" AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png 2>/dev/null || {
            # If ImageMagick not available, copy a generic icon or create empty file
            touch AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png
        }
    fi
    
    # Create AppRun
    cat > AppDir/AppRun << 'EOF'
#!/bin/bash
APPDIR="$(dirname "$(readlink -f "${0}")")"
exec "${APPDIR}/usr/bin/afro-network" "$@"
EOF
    chmod +x AppDir/AppRun
    
    # Copy desktop file to root
    cp AppDir/usr/share/applications/afro-network.desktop AppDir/
    
    # Copy icon to root
    cp AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png AppDir/
    
    # Build the project first if dist doesn't exist
    if [ ! -d "dist" ]; then
        echo "🔨 Building React application..."
        if command -v npm &> /dev/null; then
            npm run build
        elif command -v yarn &> /dev/null; then
            yarn build
        elif command -v bun &> /dev/null; then
            bun run build
        else
            echo "❌ No package manager found. Please install npm, yarn, or bun."
            exit 1
        fi
    fi
    
    # Copy built React app
    cp -r dist/* AppDir/
    
    # Build AppImage
    echo "🔨 Building AppImage..."
    appimagetool AppDir AfroNetwork.AppImage
    
    if [ -f "AfroNetwork.AppImage" ]; then
        echo "✅ AppImage built successfully: AfroNetwork.AppImage"
        echo "📱 You can now run: ./AfroNetwork.AppImage"
        echo ""
        echo "🎉 AppImage Features:"
        echo "   • Self-contained Afro Network dashboard"
        echo "   • Portable - runs on any Linux distribution"
        echo "   • No installation required"
        echo "   • Double-click to launch or run from terminal"
        echo ""
        echo "🚀 To use the AppImage:"
        echo "   1. Make it executable: chmod +x AfroNetwork.AppImage"
        echo "   2. Run it: ./AfroNetwork.AppImage"
        echo "   3. Access dashboard at http://localhost:8080"
    else
        echo "❌ AppImage build failed"
        exit 1
    fi
    
    # Cleanup
    rm -rf AppDir
    
    exit 0
fi

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

# Mobile Money Integration
AFRO_MOBILE_MONEY_ENABLED=true
AFRO_SMS_VALIDATION=true
AFRO_ADDRESS_PREFIX=afro:254700000000:
AFRO_MOBILE_COUNTRY_CODE=254
AFRO_MOBILE_MONEY_CODE=700000000

# Testnet Configuration
TESTNET_NETWORK_ID=7879
TESTNET_CHAIN_ID=7879
TESTNET_COIN=tAFRO
TESTNET_COIN_NAME=Testnet Afro
TESTNET_NETWORK_NAME=Afro Testnet
TESTNET_SUBNETWORK=Afro Testnet

# Database Configuration
POSTGRES_DB=blockscout
POSTGRES_USER=blockscout
POSTGRES_PASSWORD=blockscout_password
TESTNET_POSTGRES_PASSWORD=blockscout_testnet_password

# Explorer Configuration
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://afro-validator:8545
ETHEREUM_JSONRPC_WS_URL=ws://afro-validator:8546
TESTNET_ETHEREUM_JSONRPC_HTTP_URL=http://afro-testnet-validator:8547
TESTNET_ETHEREUM_JSONRPC_WS_URL=ws://afro-testnet-validator:8548

# CEO Agent Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
GITHUB_TOKEN=
GITHUB_REPO=afro-network/afro-blockchain

# Ports (modify if needed)
VALIDATOR_HTTP_PORT=8545
VALIDATOR_WS_PORT=8546
VALIDATOR_P2P_PORT=30303
TESTNET_VALIDATOR_HTTP_PORT=8547
TESTNET_VALIDATOR_WS_PORT=8548
TESTNET_VALIDATOR_P2P_PORT=30304
EXPLORER_PORT=4000
TESTNET_EXPLORER_PORT=4001
WEB_PORT=80
CEO_PORT=3000
EOF
    echo "✅ .env file created with mobile money support and CEO agent configuration"
fi

# Function to check if container exists and get its image ID
check_container_image() {
    local container_name=$1
    local service_name=$2
    
    # Check if container exists
    if docker ps -a --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        # Get current container's image ID
        local current_image_id=$(docker inspect --format='{{.Image}}' "${container_name}" 2>/dev/null || echo "")
        
        # Get the image ID that would be built/pulled for this service
        local expected_image_id=$(docker-compose images -q "${service_name}" 2>/dev/null || echo "")
        
        if [ -n "$current_image_id" ] && [ -n "$expected_image_id" ] && [ "$current_image_id" = "$expected_image_id" ]; then
            echo "✅ Container ${container_name} is up to date"
            return 0
        else
            echo "🔄 Container ${container_name} needs to be rebuilt"
            return 1
        fi
    else
        echo "🆕 Container ${container_name} doesn't exist, will be created"
        return 1
    fi
}

# Function to check if rebuild is needed
needs_rebuild() {
    local rebuild_needed=false
    
    echo "🔍 Checking existing containers..."
    
    # Check each service
    if ! check_container_image "afro-validator" "afro-validator"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-explorer" "afro-explorer"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-testnet-validator" "afro-testnet-validator"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-testnet-explorer" "afro-testnet-explorer"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-web" "afro-web"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-ceo" "ceo"; then
        rebuild_needed=true
    fi
    
    # Database containers don't need rebuild checks as they use base images
    
    if [ "$rebuild_needed" = true ]; then
        return 0  # Rebuild needed
    else
        return 1  # No rebuild needed
    fi
}

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Check if rebuild is needed
if needs_rebuild; then
    echo "🔨 Building Docker images..."
    docker-compose build --no-cache
else
    echo "✅ All containers are up to date, skipping rebuild"
fi

echo "🚀 Starting Afro Network stack..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo "🔍 Checking service health..."

# Check mainnet validator
if curl -s http://localhost:8545 > /dev/null; then
    echo "✅ Mainnet validator node is running (http://localhost:8545)"
else
    echo "⚠️  Mainnet validator node is not responding yet"
fi

# Check testnet validator
if curl -s http://localhost:8547 > /dev/null; then
    echo "✅ Testnet validator node is running (http://localhost:8547)"
else
    echo "⚠️  Testnet validator node is not responding yet"
fi

# Check mainnet explorer
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Mainnet explorer is running (http://localhost:4000)"
else
    echo "⚠️  Mainnet explorer is not responding yet (may take a few minutes to start)"
fi

# Check testnet explorer
if curl -s http://localhost:4001 > /dev/null; then
    echo "✅ Testnet explorer is running (http://localhost:4001)"
else
    echo "⚠️  Testnet explorer is not responding yet (may take a few minutes to start)"
fi

# Check web frontend
if curl -s http://localhost:80 > /dev/null; then
    echo "✅ Web frontend is running (http://localhost:80)"
else
    echo "⚠️  Web frontend is not responding yet"
fi

# Check CEO agent
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ CEO agent is running (http://localhost:3000)"
else
    echo "⚠️  CEO agent is not responding yet"
fi

echo ""
echo "🎉 Afro Network setup complete!"
echo ""
echo "📋 Service URLs:"
echo "   • Web Frontend: http://localhost"
echo "   • Mainnet Explorer: http://localhost:4000"
echo "   • Testnet Explorer: http://localhost:4001"
echo "   • Mainnet RPC: http://localhost:8545"
echo "   • Testnet RPC: http://localhost:8547"
echo "   • Mainnet WebSocket: ws://localhost:8546"
echo "   • Testnet WebSocket: ws://localhost:8548"
echo "   • CEO Agent API: http://localhost:3000"
echo ""
echo "🤖 CEO Agent Integration:"
echo "   • Strategic Management: AI-powered network oversight"
echo "   • Customer Support: Automated question handling"
echo "   • GitHub Integration: Automatic issue creation and PR management"
echo "   • Network Monitoring: Continuous health checks with alerting"
echo "   • Chat API: http://localhost:3000/api/chat"
echo "   • Status API: http://localhost:3000/api/status"
echo ""
echo "⚙️  CEO Agent Configuration:"
echo "   • Ollama URL: Configure OLLAMA_BASE_URL in .env"
echo "   • Model: Configure OLLAMA_MODEL in .env (default: llama3.1:8b)"
echo "   • GitHub: Set GITHUB_TOKEN and GITHUB_REPO in .env for automation"
echo ""
echo "📱 Mobile Money Integration:"
echo "   • Address Format: afro:254700000000:[extra_characters]"
echo "   • Country Code: 254 (Kenya)"
echo "   • Mobile Money Code: 700000000"
echo "   • SMS Validation: Enabled"
echo "   • OTP Generation: From address extra characters"
echo ""
echo "🔧 MetaMask Configuration:"
echo "   Mainnet:"
echo "   • Network Name: Afro Network"
echo "   • RPC URL: http://localhost:8545"
echo "   • Chain ID: 7878"
echo "   • Currency: AFRO"
echo "   • Explorer: http://localhost:4000"
echo ""
echo "   Testnet:"
echo "   • Network Name: Afro Testnet"
echo "   • RPC URL: http://localhost:8547"
echo "   • Chain ID: 7879"
echo "   • Currency: tAFRO"
echo "   • Explorer: http://localhost:4001"
echo ""
echo "📖 Next Steps:"
echo "   1. Configure CEO Agent: Edit .env file with your Ollama and GitHub settings"
echo "   2. Visit http://localhost to see the landing page"
echo "   3. Test CEO Agent: curl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{\"message\":\"What is the current network status?\"}'"
echo "   4. Click 'Add Mainnet to MetaMask' or 'Add Testnet to MetaMask'"
echo "   5. Explore the blockchain at http://localhost:4000 (mainnet) or http://localhost:4001 (testnet)"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • View CEO logs: docker-compose logs -f ceo"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo "   • Update: docker-compose pull && docker-compose up -d"
echo "   • Force rebuild: docker-compose build --no-cache && docker-compose up -d"
echo ""
echo "Enjoy your Afro Network with AI-powered CEO Agent! 🌍📱🤖"
