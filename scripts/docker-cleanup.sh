
#!/bin/bash

# Docker Cleanup and Recovery Script
# Handles broken Docker installations and segmentation faults

set -e

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

# Consistent Docker Compose version across the app
DOCKER_COMPOSE_VERSION="2.24.1"
INSTALL_DIR="/usr/local/bin"

# Function to detect system architecture
detect_architecture() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "x86_64"
            ;;
        aarch64|arm64)
            echo "aarch64"
            ;;
        armv7l)
            echo "armv7"
            ;;
        *)
            log_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
}

# Function to clean broken Docker Compose
clean_broken_docker_compose() {
    log_warning "Cleaning broken Docker Compose installation..."
    
    # Remove potentially corrupted binaries
    sudo rm -f "${INSTALL_DIR}/docker-compose" 2>/dev/null || true
    sudo rm -f /usr/bin/docker-compose 2>/dev/null || true
    sudo rm -f /usr/local/bin/docker-compose-* 2>/dev/null || true
    
    log_success "Removed broken Docker Compose binaries"
}

# Function to stop and clean Docker containers/volumes
clean_docker_system() {
    log_info "Cleaning Docker system..."
    
    # Stop all running containers
    if [ "$(docker ps -q)" ]; then
        log_info "Stopping running containers..."
        docker stop $(docker ps -q) 2>/dev/null || true
    fi
    
    # Remove all containers
    if [ "$(docker ps -aq)" ]; then
        log_info "Removing all containers..."
        docker rm $(docker ps -aq) 2>/dev/null || true
    fi
    
    # Clean up Docker system
    log_info "Pruning Docker system..."
    docker system prune -af 2>/dev/null || true
    
    # Remove dangling volumes
    log_info "Removing dangling volumes..."
    docker volume prune -f 2>/dev/null || true
    
    log_success "Docker system cleaned"
}

# Function to test Docker Compose binary
test_docker_compose() {
    local binary_path="$1"
    
    if [ -f "$binary_path" ]; then
        # Test if binary works without segfault
        if timeout 10 "$binary_path" --version >/dev/null 2>&1; then
            return 0
        else
            log_warning "Binary at $binary_path failed test"
            return 1
        fi
    else
        return 1
    fi
}

# Function to download and install Docker Compose
install_fresh_docker_compose() {
    log_info "Installing fresh Docker Compose v${DOCKER_COMPOSE_VERSION}..."
    
    local arch=$(detect_architecture)
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local download_url="https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-${os}-${arch}"
    
    log_info "Downloading from: $download_url"
    
    # Download with retry mechanism
    local max_retries=3
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if command -v curl &> /dev/null; then
            if sudo curl -L --fail --retry 3 "$download_url" -o "${INSTALL_DIR}/docker-compose"; then
                break
            fi
        elif command -v wget &> /dev/null; then
            if sudo wget --tries=3 "$download_url" -O "${INSTALL_DIR}/docker-compose"; then
                break
            fi
        else
            log_error "Neither curl nor wget found"
            exit 1
        fi
        
        retry=$((retry + 1))
        log_warning "Download failed, retry $retry/$max_retries"
        sleep 2
    done
    
    if [ $retry -eq $max_retries ]; then
        log_error "Failed to download Docker Compose after $max_retries attempts"
        exit 1
    fi
    
    # Make executable
    sudo chmod +x "${INSTALL_DIR}/docker-compose"
    
    # Test the installation
    if test_docker_compose "${INSTALL_DIR}/docker-compose"; then
        log_success "Docker Compose v${DOCKER_COMPOSE_VERSION} installed and tested successfully"
    else
        log_error "Docker Compose installation failed verification"
        exit 1
    fi
}

# Function to check Docker daemon
check_docker_daemon() {
    log_info "Checking Docker daemon..."
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        log_info "Try starting Docker with: sudo systemctl start docker"
        exit 1
    fi
    
    log_success "Docker daemon is running"
}

# Function to verify Docker version compatibility
check_docker_version() {
    log_info "Checking Docker version compatibility..."
    
    local docker_version=$(docker --version | grep -o '[0-9]\+\.[0-9]\+' | head -1)
    local major_version=$(echo $docker_version | cut -d. -f1)
    local minor_version=$(echo $docker_version | cut -d. -f2)
    
    # Require Docker 20.10+ for Compose v2 compatibility
    if [ "$major_version" -lt 20 ] || ([ "$major_version" -eq 20 ] && [ "$minor_version" -lt 10 ]); then
        log_warning "Docker version $docker_version may not be fully compatible"
        log_info "Consider upgrading to Docker 20.10+ for best compatibility"
    else
        log_success "Docker version $docker_version is compatible"
    fi
}

# Main cleanup function
main_cleanup() {
    log_info "🧹 Starting Docker cleanup and recovery"
    echo
    
    # Check if we need sudo
    if [ "$EUID" -ne 0 ] && ! groups $USER | grep -q docker; then
        log_warning "This script requires sudo or docker group membership"
    fi
    
    # Check Docker daemon first
    check_docker_daemon
    
    # Check Docker version
    check_docker_version
    
    # Clean broken Docker Compose
    clean_broken_docker_compose
    
    # Clean Docker system if requested
    read -p "Do you want to clean the entire Docker system (containers, images, volumes)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        clean_docker_system
    fi
    
    # Install fresh Docker Compose
    install_fresh_docker_compose
    
    # Final verification
    echo
    log_info "Final verification..."
    docker --version
    docker-compose --version
    
    echo
    log_success "🎉 Docker cleanup and recovery completed!"
    log_info "You can now run your Afro Network setup scripts"
}

# Handle command line arguments
case "${1:-}" in
    --clean-all)
        log_info "Running full cleanup (forced)"
        check_docker_daemon
        clean_docker_system
        clean_broken_docker_compose
        install_fresh_docker_compose
        ;;
    --compose-only)
        log_info "Cleaning Docker Compose only"
        clean_broken_docker_compose
        install_fresh_docker_compose
        ;;
    --help)
        echo "Docker Cleanup and Recovery Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --clean-all     Clean entire Docker system and reinstall Compose"
        echo "  --compose-only  Only clean and reinstall Docker Compose"
        echo "  --help          Show this help message"
        echo ""
        echo "Without options, runs interactive cleanup"
        exit 0
        ;;
    *)
        main_cleanup
        ;;
esac
