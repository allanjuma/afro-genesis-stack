
#!/bin/bash

# Afro Network Automatic Setup Script
# Handles complete setup including Docker Compose installation

set -e

# Source utility scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/docker-compose-installer.sh"
source "${SCRIPT_DIR}/env-generator.sh"
source "${SCRIPT_DIR}/docker-manager.sh"
source "${SCRIPT_DIR}/health-checker.sh"

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

# Parse command line arguments
FORCE_REINSTALL=false
SKIP_DOCKER_CHECK=false
PRODUCTION_MODE=false
VALIDATOR_ONLY=false
CEO_ONLY=false

for arg in "$@"; do
    case $arg in
        --force-reinstall)
            FORCE_REINSTALL=true
            shift
            ;;
        --skip-docker-check)
            SKIP_DOCKER_CHECK=true
            shift
            ;;
        --production)
            PRODUCTION_MODE=true
            shift
            ;;
        --validator-only)
            VALIDATOR_ONLY=true
            shift
            ;;
        --ceo-only)
            CEO_ONLY=true
            shift
            ;;
        --help)
            echo "Afro Network Auto-Setup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force-reinstall    Force reinstall Docker Compose even if present"
            echo "  --skip-docker-check  Skip Docker installation checks"
            echo "  --production         Setup for production environment"
            echo "  --validator-only     Run only validator nodes (mainnet and testnet)"
            echo "  --ceo-only          Run only the CEO management agent"
            echo "  --help              Show this help message"
            echo ""
            exit 0
            ;;
        *)
            # Unknown option
            ;;
    esac
done

# System checks function
perform_system_checks() {
    log_info "🔍 Performing system checks..."
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_success "macOS detected"
    else
        log_warning "Unsupported OS: $OSTYPE"
    fi
    
    # Check available disk space (at least 10GB)
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -gt 10485760 ]; then
        log_success "Sufficient disk space available"
    else
        log_warning "Low disk space detected. At least 10GB recommended."
    fi
    
    # Check if ports are available
    check_port() {
        local port=$1
        local service=$2
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_warning "Port $port is already in use (needed for $service)"
        else
            log_success "Port $port is available for $service"
        fi
    }
    
    if [ "$VALIDATOR_ONLY" = true ]; then
        check_port 8545 "Mainnet RPC"
        check_port 8546 "Mainnet WebSocket"
        check_port 8547 "Testnet RPC"
        check_port 8548 "Testnet WebSocket"
        check_port 30303 "Mainnet P2P"
        check_port 30304 "Testnet P2P"
    elif [ "$CEO_ONLY" = true ]; then
        check_port 3000 "CEO Agent"
    else
        check_port 80 "Web Frontend"
        check_port 3000 "CEO Agent"
        check_port 4000 "Mainnet Explorer"
        check_port 4001 "Testnet Explorer"
        check_port 8545 "Mainnet RPC"
        check_port 8546 "Mainnet WebSocket"
        check_port 8547 "Testnet RPC"
        check_port 8548 "Testnet WebSocket"
        check_port 30303 "Mainnet P2P"
        check_port 30304 "Testnet P2P"
    fi
}

# Docker environment setup
setup_docker_environment() {
    if [ "$SKIP_DOCKER_CHECK" = false ]; then
        log_info "🐋 Setting up Docker environment..."
        
        # Check Docker requirements
        check_docker_requirements
        
        # Install Docker Compose if needed or forced
        if [ "$FORCE_REINSTALL" = true ] || ! check_docker_compose; then
            install_docker_compose
        fi
        
        log_success "Docker environment ready"
    else
        log_info "Skipping Docker checks as requested"
    fi
}

# Generate environment configuration
setup_environment_config() {
    log_info "⚙️  Setting up environment configuration..."
    
    # Call env-generator function
    generate_env_file
    
    # Set production-specific configurations
    if [ "$PRODUCTION_MODE" = true ]; then
        log_info "Configuring for production environment..."
        
        # Update .env for production
        if [ -f .env ]; then
            sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
            sed -i 's/DEBUG=true/DEBUG=false/' .env
            echo "PRODUCTION_MODE=true" >> .env
        fi
    fi
    
    # Set validator-only mode
    if [ "$VALIDATOR_ONLY" = true ]; then
        log_info "Configuring for validator-only mode..."
        
        if [ -f .env ]; then
            echo "VALIDATOR_ONLY=true" >> .env
        fi
    fi
    
    # Set CEO-only mode
    if [ "$CEO_ONLY" = true ]; then
        log_info "Configuring for CEO-only mode..."
        
        if [ -f .env ]; then
            echo "CEO_ONLY=true" >> .env
        fi
    fi
}

# Deploy the stack
deploy_afro_stack() {
    if [ "$VALIDATOR_ONLY" = true ]; then
        log_info "🏗️ Deploying Afro Validator Nodes Only..."
        
        # Pull validator images only
        log_info "Pulling validator Docker images..."
        docker-compose pull afro-validator afro-testnet-validator || true
        
        # Build validator images
        log_info "Building validator images..."
        docker-compose build afro-validator afro-testnet-validator
        
        # Start validators only
        log_info "Starting validator services..."
        docker-compose up -d afro-validator afro-testnet-validator
        
    elif [ "$CEO_ONLY" = true ]; then
        log_info "🤖 Deploying CEO Management Agent Only..."
        
        # Pull CEO image only
        log_info "Pulling CEO Docker image..."
        docker-compose pull ceo || true
        
        # Build CEO image
        log_info "Building CEO image..."
        docker-compose build ceo
        
        # Start CEO only
        log_info "Starting CEO service..."
        docker-compose up -d ceo
        
    else
        log_info "🚀 Deploying Afro Network Stack..."
        
        # Pull latest images
        log_info "Pulling Docker images..."
        docker-compose pull || true
        
        # Build custom images
        log_info "Building custom images..."
        docker-compose build
        
        # Start the stack
        log_info "Starting services..."
        docker-compose up -d
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
}

# Verify deployment
verify_deployment() {
    log_info "🔍 Verifying deployment..."
    
    # Check service health
    check_service_health
    
    # Display service URLs
    echo
    log_success "🎉 Afro Network deployed successfully!"
    echo
    
    if [ "$VALIDATOR_ONLY" = true ]; then
        log_info "Validator Node URLs:"
        echo "  ⚡ Mainnet RPC: http://localhost:8545"
        echo "  ⚡ Testnet RPC: http://localhost:8547"
        echo "  🔗 Mainnet WebSocket: ws://localhost:8546"
        echo "  🔗 Testnet WebSocket: ws://localhost:8548"
    elif [ "$CEO_ONLY" = true ]; then
        log_info "CEO Management Agent URL:"
        echo "  🤖 CEO Agent: http://localhost:3000"
    else
        log_info "Service URLs:"
        echo "  🌐 Website: http://localhost"
        echo "  🔍 Mainnet Explorer: http://localhost:4000"
        echo "  🔍 Testnet Explorer: http://localhost:4001"
        echo "  🤖 CEO Agent: http://localhost:3000"
        echo "  ⚡ Mainnet RPC: http://localhost:8545"
        echo "  ⚡ Testnet RPC: http://localhost:8547"
    fi
    echo
    
    # Display management commands
    log_info "Management commands:"
    if [ "$VALIDATOR_ONLY" = true ]; then
        echo "  📊 Check validators: docker-compose ps afro-validator afro-testnet-validator"
        echo "  📋 View logs: docker-compose logs -f afro-validator afro-testnet-validator"
        echo "  🛑 Stop validators: docker-compose stop afro-validator afro-testnet-validator"
        echo "  🔄 Restart: docker-compose restart afro-validator afro-testnet-validator"
    elif [ "$CEO_ONLY" = true ]; then
        echo "  📊 Check CEO: docker-compose ps ceo"
        echo "  📋 View logs: docker-compose logs -f ceo"
        echo "  🛑 Stop CEO: docker-compose stop ceo"
        echo "  🔄 Restart: docker-compose restart ceo"
    else
        echo "  📊 Check status: docker-compose ps"
        echo "  📋 View logs: docker-compose logs -f"
        echo "  🛑 Stop stack: docker-compose down"
        echo "  🔄 Restart: docker-compose restart"
    fi
    echo
}

# Cleanup function for failed deployments
cleanup_on_failure() {
    log_error "Setup failed. Cleaning up..."
    if [ "$VALIDATOR_ONLY" = true ]; then
        docker-compose stop afro-validator afro-testnet-validator 2>/dev/null || true
        docker-compose rm -f afro-validator afro-testnet-validator 2>/dev/null || true
    elif [ "$CEO_ONLY" = true ]; then
        docker-compose stop ceo 2>/dev/null || true
        docker-compose rm -f ceo 2>/dev/null || true
    else
        docker-compose down --remove-orphans 2>/dev/null || true
    fi
    log_info "Cleanup completed"
}

# Main setup function
main_setup() {
    if [ "$VALIDATOR_ONLY" = true ]; then
        log_info "🏗️ Starting Afro Network Validator-Only Setup"
    elif [ "$CEO_ONLY" = true ]; then
        log_info "🤖 Starting Afro Network CEO-Only Setup"
    else
        log_info "🚀 Starting Afro Network Automatic Setup"
    fi
    echo
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Run setup steps
    perform_system_checks
    setup_docker_environment
    setup_environment_config
    deploy_afro_stack
    verify_deployment
    
    log_success "✨ Setup completed successfully!"
}

# Run main setup
main_setup "$@"
