
#!/bin/bash

# AppImage build script for Docker container
set -e

echo "🚀 Building Afro Network AppImage in Docker container..."

# Detect architecture
SYSTEM_ARCH=$(uname -m)
case "$SYSTEM_ARCH" in
    x86_64)
        ARCH="x86_64"
        ;;
    aarch64|arm64)
        ARCH="aarch64"
        ;;
    armv7l)
        ARCH="armhf"
        ;;
    i686|i386)
        ARCH="i686"
        ;;
    *)
        echo "⚠️  Unknown architecture: $SYSTEM_ARCH, defaulting to x86_64"
        ARCH="x86_64"
        ;;
esac

echo "🏗️  Building for architecture: $ARCH"
export ARCH

# Build the React app first (crucial step!)
echo "🔨 Building React application..."
npm run build

# Verify build output
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "❌ Build failed - dist directory is missing or empty"
    echo "Contents of workspace:"
    ls -la
    exit 1
fi

echo "✅ React app built successfully - $(ls dist | wc -l) files created"
echo "🔍 Built files:"
ls -la dist/

# Create AppImage directory structure
echo "📁 Creating AppImage directory structure..."
rm -rf AppDir
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# Copy ALL built React app files to AppDir root (not subdirectory)
echo "📦 Copying ALL built React app files to AppDir root..."
cp -r dist/* AppDir/

# Verify critical files were copied to AppDir root
if [ ! -f "AppDir/index.html" ]; then
    echo "❌ Critical error: index.html not found in AppDir root"
    echo "Contents of dist/:"
    ls -la dist/
    echo "Contents of AppDir/:"
    ls -la AppDir/
    exit 1
fi

echo "✅ All React app files copied to AppDir root"
echo "🔍 AppDir contents:"
ls -la AppDir/

# Create the main executable script that serves from AppDir root
cat > AppDir/usr/bin/afro-network << 'EOF'
#!/bin/bash
APPDIR="$(dirname "$(readlink -f "${0}")")/../.."
export PATH="${APPDIR}/usr/bin:${PATH}"

# Start the React dashboard from AppDir root where files are located
cd "${APPDIR}"
if [ -f "index.html" ]; then
    echo "🚀 Starting Afro Network Dashboard on http://localhost:8080"
    echo "📁 Serving files from: ${APPDIR}"
    
    # Start HTTP server in background
    python3 -m http.server 8080 > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Open browser if available
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080 2>/dev/null &
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:8080 2>/dev/null &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser http://localhost:8080 2>/dev/null &
    else
        echo "📱 Dashboard available at: http://localhost:8080"
    fi
    
    # Keep the server running
    echo "🛡️  Server running (PID: $SERVER_PID). Press Ctrl+C to stop."
    trap "kill $SERVER_PID 2>/dev/null" EXIT
    wait $SERVER_PID
else
    echo "❌ Dashboard files not found at: ${APPDIR}"
    echo "Looking for index.html in: ${APPDIR}/index.html"
    echo "Contents of AppDir:"
    ls -la "${APPDIR}"
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
Categories=Development;
StartupNotify=true
EOF

# Copy icon
if [ -f "web/site/images/afro-logo.png" ]; then
    cp web/site/images/afro-logo.png AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png
else
    # Create a simple placeholder icon
    echo "⚠️  Afro logo not found, creating placeholder icon"
    # Create a simple text-based icon
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > AppDir/usr/share/icons/hicolor/256x256/apps/afro-network.png
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

# Final verification before building
echo "🔍 Final verification before AppImage creation:"
echo "- index.html: $([ -f "AppDir/index.html" ] && echo "✅ Found" || echo "❌ Missing")"
echo "- assets/: $([ -d "AppDir/assets" ] && echo "✅ Found $(ls AppDir/assets | wc -l) files" || echo "❌ Missing")"
echo "- AppRun: $([ -f "AppDir/AppRun" ] && echo "✅ Found" || echo "❌ Missing")"

# Build AppImage
echo "🔨 Building AppImage for architecture: $ARCH..."
ARCH=$ARCH appimagetool AppDir AfroNetwork.AppImage

if [ -f "AfroNetwork.AppImage" ]; then
    # Copy to output directory
    cp AfroNetwork.AppImage /output/
    
    echo "✅ AppImage built successfully: AfroNetwork.AppImage"
    echo "📱 You can now run: ./AfroNetwork.AppImage"
    echo ""
    echo "🎉 AppImage Features:"
    echo "   • Self-contained Afro Network dashboard"  
    echo "   • Portable - runs on any Linux distribution"
    echo "   • No installation required"
    echo "   • Double-click to launch or run from terminal"
    echo "   • Built with Node.js v$(node -v | cut -d'v' -f2)"
    echo "   • Architecture: $ARCH"
    echo "   • Dashboard files: $(ls AppDir/*.html AppDir/*.js AppDir/*.css 2>/dev/null | wc -l) files included"
else
    echo "❌ AppImage build failed"
    exit 1
fi

# Cleanup
rm -rf AppDir

echo "🎯 AppImage available in output directory"
