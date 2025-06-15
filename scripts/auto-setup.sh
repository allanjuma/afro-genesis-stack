
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
WEB_ONLY=false
REINIT=false
CLEAN_DOCKER=false

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
        --web-only)
            WEB_ONLY=true
            shift
            ;;
        --reinit)
            REINIT=true
            echo -e "\033[1;33m⚠️  Reinitialization mode: --reinit flag detected and running (auto-setup.sh)\033[0m"
            shift
            ;;
        --clean-docker)
            CLEAN_DOCKER=true
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
            echo "  --web-only          Run only the web frontend"
            echo "  --reinit            Force reinitialization of blockchain data"
            echo "  --clean-docker      Clean broken Docker installation first"
            echo "  --help              Show this help message"
            echo ""
            exit 0
            ;;
        *)
            # Unknown option
            ;;
    esac
done

# Error handling for Docker operations
handle_docker_error() {
    log_error "Docker operation failed. This might be due to a broken Docker Compose installation."
    log_info "💡 Suggestions:"
    log_info "   1. Run: bash scripts/docker-cleanup.sh --compose-only"
    log_info "   2. Or restart with: $0 --clean-docker $*"
    exit 1
}

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
    elif [ "$WEB_ONLY" = true ]; then
        check_port 80 "Web Frontend"
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
        
        # Run Docker cleanup if requested
        if [ "$CLEAN_DOCKER" = true ]; then
            log_info "🧹 Running Docker cleanup first..."
            if [ -f "${SCRIPT_DIR}/docker-cleanup.sh" ]; then
                bash "${SCRIPT_DIR}/docker-cleanup.sh" --compose-only
            else
                log_warning "Docker cleanup script not found, continuing..."
            fi
        fi
        
        # Set up error handling for this section
        trap 'handle_docker_error' ERR
        
        # Check Docker requirements
        check_docker_requirements
        
        # Install Docker Compose if needed or forced
        if [ "$FORCE_REINSTALL" = true ] || ! check_docker_compose; then
            install_docker_compose
        fi
        
        # Remove error trap
        trap - ERR
        
        log_success "Docker environment ready"
    else
        log_info "Skipping Docker checks as requested"
    fi
}

# Generate environment configuration
setup_environment_config() {
    # Skip environment config generation for web-only mode
    if [ "$WEB_ONLY" = true ]; then
        log_info "⚙️  Skipping environment configuration for web-only mode..."
        return
    fi
    
    log_info "⚙️  Setting up environment configuration..."
    
    # Call env-generator function
    generate_env_file
    
    # ... keep existing code (production mode, validator-only mode, CEO-only mode, reinit mode configurations)
    
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
    
    # Set reinit mode
    if [ "$REINIT" = true ]; then
        log_info "Configuring for blockchain reinitialization..."
        
        if [ -f .env ]; then
            echo "REINIT_BLOCKCHAIN=true" >> .env
        fi
    fi
}

# Deploy the stack
deploy_afro_stack() {
    # Set up error handling for Docker operations
    trap 'handle_docker_error' ERR
    
    # Handle reinitialization
    if [ "$REINIT" = true ]; then
        echo -e "\033[1;33m🔄 Reinitializing blockchain data (auto-setup.sh detected --reinit flag)...\033[0m"
        
        # Stop containers
        log_info "🛑 Stopping containers..."
        docker-compose down
        
        # Remove validator volumes to force fresh initialization
        log_info "🗑️  Removing blockchain data volumes..."
        docker volume rm $(docker-compose config --services | grep -E "(validator|testnet)" | xargs -I {} echo "$(basename $(pwd))_{}_data") 2>/dev/null || log_info "Some volumes not found (normal for first run)"
        
        # Start containers with fresh data
        log_info "🚀 Starting containers with fresh blockchain data..."
    fi
    
    if [ "$VALIDATOR_ONLY" = true ]; then
        log_info "🏗️ Deploying Afro Validator Nodes Only..."
        
        # Pull validator images only
        log_info "Pulling validator Docker images..."
        docker-compose pull afro-validator afro-testnet-validator || true
        
        # Start validators only
        log_info "Starting validator services..."
        docker-compose up -d afro-validator afro-testnet-validator
        
    elif [ "$CEO_ONLY" = true ]; then
        log_info "🤖 Deploying CEO Management Agent Only..."
        
        # Pull CEO image only
        log_info "Pulling CEO Docker image..."
        docker-compose pull ceo || true
        
        # Start CEO only
        log_info "Starting CEO service..."
        docker-compose up -d ceo
        
    elif [ "$WEB_ONLY" = true ]; then
        log_info "🌐 Deploying Web Container Only (static frontend/docs)..."

        # Stop all services first to ensure clean state
        log_info "🛑 Stopping all services to ensure clean web-only deployment..."
        docker-compose down 2>/dev/null || true

        # Pull just the web image
        log_info "Pulling web Docker image..."
        docker-compose pull afro-web || true

        # Start ONLY the web container
        log_info "Starting web service only (no validators, CEO, databases, or explorers)..."
        docker-compose up -d afro-web

        log_success "🌐 Web container deployed successfully!"
        log_info "🌐 Website available at: http://localhost"
        
        # Remove error trap for web-only since we're returning early
        trap - ERR
        return
    else
        log_info "🚀 Deploying Afro Network Stack..."
        
        # Pull latest images
        log_info "Pulling Docker images..."
        docker-compose pull || true
        
        # Start the stack
        log_info "Starting services..."
        docker-compose up -d
    fi
    
    # Remove error trap after successful deployment
    trap - ERR
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
}

# Verify deployment
verify_deployment() {
    log_info "🔍 Verifying deployment..."
    
    # For web-only, just check the web container
    if [ "$WEB_ONLY" = true ]; then
        if docker-compose ps afro-web | grep -q "Up"; then
            log_success "🎉 Web container deployed successfully!"
            echo
            log_info "Web Frontend URL:"
            echo "  🌐 Website: http://localhost"
            echo
            log_info "Management commands:"
            echo "  📊 Check web: docker-compose ps afro-web"
            echo "  📋 View logs: docker-compose logs -f afro-web"
            echo "  🛑 Stop web: docker-compose stop afro-web"
            echo "  🔄 Restart: docker-compose restart afro-web"
        else
            log_error "Web container failed to start"
            echo "📋 Check logs: docker-compose logs afro-web"
        fi
        return
    fi
    
    # Check service health for other modes
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
    elif [ "$WEB_ONLY" = true ]; then
        docker-compose stop afro-web 2>/dev/null || true
        docker-compose rm -f afro-web 2>/dev/null || true
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
    elif [ "$WEB_ONLY" = true ]; then
        log_info "🌐 Starting Afro Network Web-Only Setup"
    else
        log_info "🚀 Starting Afro Network Automatic Setup"
    fi
    echo
    
    # Set up general error handling
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
