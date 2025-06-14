#!/bin/bash

# AppImage builder for Afro Network
# This script handles the creation of the AppImage package

set -e

install_fuse() {
    echo "🔍 Checking FUSE installation..."
    
    # Check if FUSE is already installed
    if ldconfig -p | grep -q libfuse.so.2; then
        echo "✅ FUSE is already installed"
        return 0
    fi
    
    echo "📦 FUSE not found, installing..."
    
    # Detect package manager and install FUSE
    if command -v apt-get &> /dev/null; then
        echo "🔨 Installing FUSE with apt-get..."
        
        # Try to update package lists, but don't fail if some repositories are broken
        echo "📋 Updating package lists..."
        if ! sudo apt-get update 2>/dev/null; then
            echo "⚠️  Some repository updates failed, but continuing with FUSE installation..."
            echo "💡 You may want to clean up your repository configuration later"
        fi
        
        # Install FUSE packages
        if sudo apt-get install -y fuse libfuse2; then
            echo "✅ FUSE packages installed successfully"
        else
            echo "❌ Failed to install FUSE packages via apt-get"
            echo "💡 Try running manually: sudo apt-get install fuse libfuse2"
            exit 1
        fi
    elif command -v yum &> /dev/null; then
        echo "🔨 Installing FUSE with yum..."
        sudo yum install -y fuse fuse-libs
    elif command -v dnf &> /dev/null; then
        echo "🔨 Installing FUSE with dnf..."
        sudo dnf install -y fuse fuse-libs
    elif command -v pacman &> /dev/null; then
        echo "🔨 Installing FUSE with pacman..."
        sudo pacman -S --noconfirm fuse2
    elif command -v zypper &> /dev/null; then
        echo "🔨 Installing FUSE with zypper..."
        sudo zypper install -y fuse libfuse2
    else
        echo "❌ Could not detect package manager to install FUSE"
        echo "💡 Please install FUSE manually:"
        echo "   • Ubuntu/Debian: sudo apt-get install fuse libfuse2"
        echo "   • CentOS/RHEL: sudo yum install fuse fuse-libs"
        echo "   • Fedora: sudo dnf install fuse fuse-libs"
        echo "   • Arch: sudo pacman -S fuse2"
        echo "   • openSUSE: sudo zypper install fuse libfuse2"
        exit 1
    fi
    
    # Verify installation
    if ldconfig -p | grep -q libfuse.so.2; then
        echo "✅ FUSE installed successfully"
    else
        echo "❌ FUSE installation failed or library not found"
        echo "💡 You may need to:"
        echo "   • Restart your session"
        echo "   • Run: sudo ldconfig"
        echo "   • Check if your user is in the 'fuse' group: sudo usermod -a -G fuse \$USER"
        echo "   • If the PostgreSQL repository error persists, you can remove it with:"
        echo "     sudo rm /etc/apt/sources.list.d/pgdg.list"
        echo "     sudo apt-get update"
        exit 1
    fi
}

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

ensure_node_v18() {
    echo "🔍 Checking Node.js version..."
    
    # Get current Node.js version
    if command -v node &> /dev/null; then
        current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        echo "Current Node.js version: v$(node -v | cut -d'v' -f2)"
        
        if [ "$current_version" -lt 18 ]; then
            echo "⚠️  Node.js v18+ required for crypto compatibility"
            
            # Check if nvm is available
            if ! command -v nvm &> /dev/null; then
                echo "📦 nvm not found, installing nvm..."
                
                # Download and install nvm
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                
                # Source nvm to make it available in current session
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
                
                # Verify nvm installation
                if ! command -v nvm &> /dev/null; then
                    echo "❌ Failed to install nvm. Trying alternative installation method..."
                    
                    # Alternative: try wget if curl failed
                    if command -v wget &> /dev/null; then
                        wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                        
                        # Source nvm again
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
                    fi
                    
                    # Final check
                    if ! command -v nvm &> /dev/null; then
                        echo "❌ Failed to install nvm. Please install it manually and rerun the script."
                        echo "💡 Visit: https://github.com/nvm-sh/nvm#installing-and-updating"
                        exit 1
                    fi
                fi
                
                echo "✅ nvm installed successfully"
            else
                # Source nvm if it exists but isn't loaded
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
            fi
            
            # Install and use Node.js v18
            echo "📦 Installing and using Node.js v18 via nvm..."
            nvm install 18
            nvm use 18
            
            # Verify the switch was successful
            if command -v node &> /dev/null; then
                new_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
                if [ "$new_version" -ge 18 ]; then
                    echo "✅ Successfully switched to Node.js v$(node -v | cut -d'v' -f2)"
                else
                    echo "❌ Failed to switch to Node.js v18. Current version: v$(node -v | cut -d'v' -f2)"
                    exit 1
                fi
            else
                echo "❌ Node.js not available after nvm installation"
                exit 1
            fi
        else
            echo "✅ Node.js v18+ detected"
        fi
    else
        echo "❌ Node.js not found. Installing via nvm..."
        
        # Install nvm if not present
        if ! command -v nvm &> /dev/null; then
            echo "📦 Installing nvm..."
            
            # Download and install nvm
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
            
            # Source nvm
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
            
            if ! command -v nvm &> /dev/null; then
                echo "❌ Failed to install nvm. Please install Node.js v18+ manually."
                exit 1
            fi
        fi
        
        # Install Node.js v18
        echo "📦 Installing Node.js v18..."
        nvm install 18
        nvm use 18
        
        if command -v node &> /dev/null; then
            echo "✅ Node.js v$(node -v | cut -d'v' -f2) installed successfully"
        else
            echo "❌ Failed to install Node.js"
            exit 1
        fi
    fi
}

build_appimage() {
    echo "🚀 Building Afro Network AppImage..."
    
    # Install FUSE first
    install_fuse
    
    # Ensure Node.js v18+ is being used
    ensure_node_v18
    
    # Install dependencies
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
    
    # Detect system architecture
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
    
    echo "🏗️  Detected architecture: $ARCH"
    export ARCH
    
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
    
    # Create desktop file with single main category
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
        echo "🔨 Building React application with Node.js v$(node -v | cut -d'v' -f2)..."
        
        build_success=false
        
        # Strategy 1: Try with node polyfills plugin (using Node v18+)
        echo "📦 Attempting build with node polyfills..."
        if command -v npm &> /dev/null; then
            # Create a temporary vite config that includes node polyfills
            cat > vite.config.temp.ts << 'VITE_EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
VITE_EOF
            
            # Try building with the temporary config
            if npx vite build --config vite.config.temp.ts; then
                build_success=true
                echo "✅ Build succeeded with node polyfills and Node.js v$(node -v | cut -d'v' -f2)"
            fi
            
            # Clean up temporary config
            rm -f vite.config.temp.ts
        fi
        
        # Strategy 2: Try normal build if polyfill didn't work or npm not present
        if [ "$build_success" = false ]; then
            echo "📦 Attempting normal build with Node.js v$(node -v | cut -d'v' -f2)..."
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
            fi
        fi
        
        # If all strategies failed, exit with error
        if [ "$build_success" = false ]; then
            echo "❌ All build strategies failed with Node.js v$(node -v | cut -d'v' -f2)."
            echo "💡 Try running 'npm run build' manually to see the full error output."
            echo "🔧 Ensure you're using Node.js v18+ for crypto compatibility."
            exit 1
        fi
    fi
    
    # Copy built React app
    cp -r dist/* AppDir/
    
    # Build AppImage with proper architecture
    echo "🔨 Building AppImage for architecture: $ARCH..."
    ARCH=$ARCH appimagetool AppDir AfroNetwork.AppImage
    
    if [ -f "AfroNetwork.AppImage" ]; then
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
