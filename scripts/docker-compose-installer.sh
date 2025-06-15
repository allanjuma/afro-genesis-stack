
#!/bin/bash

# Docker Compose Auto-Installer Script
# Automatically detects and installs Docker Compose if missing

set -e

# Consistent version across the entire app
DOCKER_COMPOSE_VERSION="2.24.1"
INSTALL_DIR="/usr/local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        log_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    log_success "Docker is installed: $(docker --version)"
}

# Function to safely test Docker Compose
safe_test_docker_compose() {
    local binary_path="$1"
    
    if [ ! -f "$binary_path" ]; then
        return 1
    fi
    
    # Use timeout to prevent hanging and capture segfaults
    if timeout 10 "$binary_path" --version >/dev/null 2>&1; then
        return 0
    else
        log_warning "Docker Compose binary at $binary_path failed test (possible segmentation fault)"
        return 1
    fi
}

# Check if Docker Compose v2 is available through Docker CLI
check_docker_compose_v2() {
    if docker compose version &> /dev/null 2>&1; then
        local version=$(docker compose version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        if [ -n "$version" ]; then
            log_success "Docker Compose v2 found through Docker CLI: v$version"
            return 0
        fi
    fi
    return 1
}

# Check if Docker Compose is installed and working
check_docker_compose() {
    # First check for Docker Compose v2 through Docker CLI
    if check_docker_compose_v2; then
        return 0
    fi
    
    # Then check for docker-compose (v1) standalone binary
    if command -v docker-compose &> /dev/null; then
        if safe_test_docker_compose "$(command -v docker-compose)"; then
            local version=$(docker-compose --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
            if [ -n "$version" ]; then
                log_success "Docker Compose v1 found and working: v$version"
                
                # Check if version matches our target
                if [ "$version" != "$DOCKER_COMPOSE_VERSION" ]; then
                    log_warning "Version mismatch. Expected: v$DOCKER_COMPOSE_VERSION, Found: v$version"
                    return 1
                fi
                return 0
            fi
        else
            log_warning "Docker Compose v1 found but not working properly"
            return 1
        fi
    fi
    
    log_info "Docker Compose not found. Will install v$DOCKER_COMPOSE_VERSION..."
    return 1
}

# Install Docker Compose
install_docker_compose() {
    # Check one more time if Docker Compose v2 is available before installing v1
    if check_docker_compose_v2; then
        log_info "Docker Compose v2 is available through Docker CLI. Creating compatibility alias..."
        setup_docker_compose_alias
        return 0
    fi
    
    log_info "Installing Docker Compose v${DOCKER_COMPOSE_VERSION}..."
    
    # Detect architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH="x86_64"
            ;;
        aarch64|arm64)
            ARCH="aarch64"
            ;;
        armv7l)
            ARCH="armv7"
            ;;
        *)
            log_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    # Detect OS
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    # Remove any existing broken installation
    sudo rm -f "${INSTALL_DIR}/docker-compose" 2>/dev/null || true
    
    # Download Docker Compose
    DOWNLOAD_URL="https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-${OS}-${ARCH}"
    
    log_info "Downloading from: $DOWNLOAD_URL"
    
    # Download with retry mechanism
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if command -v curl &> /dev/null; then
            if sudo curl -L --fail --retry 3 --max-time 300 "$DOWNLOAD_URL" -o "${INSTALL_DIR}/docker-compose"; then
                break
            fi
        elif command -v wget &> /dev/null; then
            if sudo wget --timeout=300 --tries=3 "$DOWNLOAD_URL" -O "${INSTALL_DIR}/docker-compose"; then
                break
            fi
        else
            log_error "Neither curl nor wget found. Please install one of them."
            exit 1
        fi
        
        retry=$((retry + 1))
        log_warning "Download failed, retry $retry/$max_retries"
        sleep 2
    done
    
    if [ $retry -eq $max_retries ]; then
        log_error "Failed to download Docker Compose after $max_retries attempts"
        log_info "You can try running: bash scripts/docker-cleanup.sh --compose-only"
        exit 1
    fi
    
    # Make executable
    sudo chmod +x "${INSTALL_DIR}/docker-compose"
    
    # Verify installation with safe test
    if safe_test_docker_compose "${INSTALL_DIR}/docker-compose"; then
        log_success "Docker Compose installed successfully: $(docker-compose --version)"
    else
        log_error "Docker Compose installation failed verification"
        log_info "Try running: bash scripts/docker-cleanup.sh --compose-only"
        exit 1
    fi
}

# Create Docker Compose alias for v2
setup_docker_compose_alias() {
    if docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_info "Setting up docker-compose alias for Docker Compose v2..."
        
        # Create a wrapper script
        sudo tee "${INSTALL_DIR}/docker-compose" > /dev/null << 'EOF'
#!/bin/bash
# Docker Compose v2 compatibility wrapper
exec docker compose "$@"
EOF
        sudo chmod +x "${INSTALL_DIR}/docker-compose"
        log_success "Docker Compose alias created"
    fi
}

# Verify Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker service."
        log_info "Try: sudo systemctl start docker"
        exit 1
    fi
    
    log_success "Docker daemon is running"
}

# Add user to docker group if needed
setup_docker_permissions() {
    if ! groups $USER | grep &> /dev/null '\bdocker\b'; then
        log_warning "User $USER is not in the docker group"
        log_info "Adding user to docker group..."
        sudo usermod -aG docker $USER
        log_warning "Please log out and log back in for group changes to take effect"
        log_info "Or run: newgrp docker"
    else
        log_success "User has proper Docker permissions"
    fi
}

# Check Docker requirements wrapper
check_docker_requirements() {
    check_docker
    check_docker_daemon
    setup_docker_permissions
}

# Main installation function
main() {
    log_info "🐋 Docker Compose Auto-Installer (v${DOCKER_COMPOSE_VERSION})"
    echo
    
    # Check Docker
    check_docker
    
    # Check Docker daemon
    check_docker_daemon
    
    # Check Docker permissions
    setup_docker_permissions
    
    # Check and install Docker Compose
    if ! check_docker_compose; then
        install_docker_compose
    fi
    
    # Setup alias if needed
    setup_docker_compose_alias
    
    echo
    log_success "🎉 Docker Compose setup completed!"
    log_info "Using consistent version: v${DOCKER_COMPOSE_VERSION}"
    
    # Test Docker Compose
    echo
    log_info "Testing Docker Compose..."
    if safe_test_docker_compose "$(command -v docker-compose)"; then
        docker-compose --version
    else
        log_error "Docker Compose test failed after installation"
        log_info "Try running: bash scripts/docker-cleanup.sh --compose-only"
        exit 1
    fi
    
    echo
    log_success "✨ Ready to deploy Afro Network Stack!"
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
