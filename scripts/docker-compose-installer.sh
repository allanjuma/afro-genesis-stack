
#!/bin/bash

# Docker Compose Auto-Installer Script
# Automatically detects and installs Docker Compose if missing

set -e

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

# Check if Docker Compose is installed
check_docker_compose() {
    # Check for docker-compose (v1) or docker compose (v2)
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose v1 found: $(docker-compose --version)"
        return 0
    elif docker compose version &> /dev/null; then
        log_success "Docker Compose v2 found: $(docker compose version)"
        return 0
    else
        log_warning "Docker Compose not found. Installing..."
        return 1
    fi
}

# Install Docker Compose
install_docker_compose() {
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
    
    # Download Docker Compose
    DOWNLOAD_URL="https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-${OS}-${ARCH}"
    
    log_info "Downloading from: $DOWNLOAD_URL"
    
    if command -v curl &> /dev/null; then
        sudo curl -L "$DOWNLOAD_URL" -o "${INSTALL_DIR}/docker-compose"
    elif command -v wget &> /dev/null; then
        sudo wget "$DOWNLOAD_URL" -O "${INSTALL_DIR}/docker-compose"
    else
        log_error "Neither curl nor wget found. Please install one of them."
        exit 1
    fi
    
    # Make executable
    sudo chmod +x "${INSTALL_DIR}/docker-compose"
    
    # Verify installation
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose installed successfully: $(docker-compose --version)"
    else
        log_error "Docker Compose installation failed"
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
docker compose "$@"
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

# Main installation function
main() {
    log_info "🐋 Docker Compose Auto-Installer"
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
    log_info "You can now use 'docker-compose' command"
    
    # Test Docker Compose
    echo
    log_info "Testing Docker Compose..."
    docker-compose --version
    
    echo
    log_success "✨ Ready to deploy Afro Network Stack!"
}

# Run main function
main "$@"
