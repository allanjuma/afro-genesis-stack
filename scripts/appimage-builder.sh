
#!/bin/bash

# AppImage builder for Afro Network
# This script handles the creation of the AppImage package

set -e

install_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Handle esbuild version conflicts by clearing cache if needed
    if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
        echo "🧹 Clearing existing node_modules and package-lock.json to resolve version conflicts..."
        rm -rf node_modules
        rm -f package-lock.json
    fi
    
    # Install dependencies using available package manager
    if command -v bun &> /dev/null; then
        echo "🔨 Installing dependencies with bun..."
        bun install
    elif command -v npm &> /dev/null; then
        echo "🔨 Installing dependencies with npm..."
        npm install --no-package-lock
    elif command -v yarn &> /dev/null; then
        echo "🔨 Installing dependencies with yarn..."
        yarn install
    else
        echo "❌ No package manager found. Please install npm, yarn, or bun."
        exit 1
    fi
}

build_appimage() {
    echo "🚀 Building Afro Network AppImage only..."
    
    # Install dependencies first
    install_dependencies
    
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
        
        # Try building without legacy provider first
        build_success=false
        
        # Build with appropriate package manager
        if command -v bun &> /dev/null; then
            echo "Using bun to build..."
            if bun run build; then
                build_success=true
            fi
        elif command -v npm &> /dev/null; then
            echo "Using npm to build..."
            if npm run build; then
                build_success=true
            fi
        elif command -v yarn &> /dev/null; then
            echo "Using yarn to build..."
            if yarn build; then
                build_success=true
            fi
        else
            echo "❌ No package manager found. Please install npm, yarn, or bun."
            exit 1
        fi
        
        # If build failed, try with legacy OpenSSL support using direct node command
        if [ "$build_success" = false ]; then
            echo "⚠️  Build failed, trying with legacy OpenSSL support..."
            
            if command -v bun &> /dev/null; then
                echo "Using bun with legacy OpenSSL..."
                node --openssl-legacy-provider node_modules/.bin/vite build || {
                    echo "❌ Build failed even with legacy OpenSSL support"
                    exit 1
                }
            elif command -v npm &> /dev/null; then
                echo "Using npm with legacy OpenSSL..."
                node --openssl-legacy-provider node_modules/.bin/vite build || {
                    echo "❌ Build failed even with legacy OpenSSL support"
                    exit 1
                }
            elif command -v yarn &> /dev/null; then
                echo "Using yarn with legacy OpenSSL..."
                node --openssl-legacy-provider node_modules/.bin/yarn build || {
                    echo "❌ Build failed even with legacy OpenSSL support"
                    exit 1
                }
            fi
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
}
