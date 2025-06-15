
#!/bin/bash

# Afro Network Docker Stack Setup Script
# This script sets up the complete Afro blockchain infrastructure with automatic Docker Compose installation

set -e

# Source utility scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if auto-setup script exists, otherwise use legacy setup
if [ -f "${SCRIPT_DIR}/scripts/auto-setup.sh" ]; then
    source "${SCRIPT_DIR}/scripts/auto-setup.sh"
else
    # Legacy setup - source individual scripts
    source "${SCRIPT_DIR}/scripts/docker-compose-installer.sh"
    source "${SCRIPT_DIR}/scripts/env-generator.sh"
    source "${SCRIPT_DIR}/scripts/docker-manager.sh"
    source "${SCRIPT_DIR}/scripts/health-checker.sh"
fi

# Parse command line arguments
APPIMAGE_ONLY=false
AUTO_SETUP=true
VALIDATOR_ONLY=false

show_help() {
    echo "Afro Network Docker Stack Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --appimage-only      Build only the AppImage package"
    echo "  --validator-only     Run only validator nodes (mainnet and testnet)"
    echo "  --manual            Skip automatic setup, use manual mode"
    echo "  --force-reinstall   Force reinstall Docker Compose even if present"
    echo "  --skip-docker-check Skip Docker installation checks"
    echo "  --production        Setup for production environment"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                   Full stack setup with auto-install"
    echo "  $0 --validator-only  Only validator nodes"
    echo "  $0 --appimage-only   Build AppImage package only"
    echo "  $0 --production      Production deployment"
    echo ""
    exit 0
}

for arg in "$@"; do
    case $arg in
        --appimage-only)
            APPIMAGE_ONLY=true
            AUTO_SETUP=false
            shift
            ;;
        --validator-only)
            VALIDATOR_ONLY=true
            shift
            ;;
        --manual)
            AUTO_SETUP=false
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            # Pass unknown options to auto-setup
            ;;
    esac
done

# Handle AppImage-only mode
if [ "$APPIMAGE_ONLY" = true ]; then
    if [ -f "${SCRIPT_DIR}/scripts/appimage-builder.sh" ]; then
        source "${SCRIPT_DIR}/scripts/appimage-builder.sh"
        build_appimage
    else
        echo "❌ AppImage builder not found"
        exit 1
    fi
    exit 0
fi

# Handle validator-only mode
if [ "$VALIDATOR_ONLY" = true ]; then
    echo "🏗️ Setting up Afro Network Validators Only..."
    
    # Run automatic setup with validator-only flag
    if [ "$AUTO_SETUP" = true ] && [ -f "${SCRIPT_DIR}/scripts/auto-setup.sh" ]; then
        echo "🤖 Running automatic validator-only setup..."
        main_setup --validator-only "$@"
    else
        echo "❌ Validator-only mode requires auto-setup"
        exit 1
    fi
    exit 0
fi

# Run automatic setup if available
if [ "$AUTO_SETUP" = true ] && [ -f "${SCRIPT_DIR}/scripts/auto-setup.sh" ]; then
    echo "🤖 Running automatic setup..."
    main_setup "$@"
    exit 0
fi

# Legacy manual setup mode
echo "🚀 Setting up Afro Network Docker Stack (Manual Mode)..."

# Check Docker requirements with auto-install
echo "🐋 Checking Docker requirements..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "ℹ️  Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Auto-install Docker Compose if missing
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "⚠️  Docker Compose not found. Installing automatically..."
    if [ -f "${SCRIPT_DIR}/scripts/docker-compose-installer.sh" ]; then
        main  # Call Docker Compose installer
    else
        echo "❌ Docker Compose installer not found. Please install Docker Compose manually."
        exit 1
    fi
else
    echo "✅ Docker Compose is available"
fi

# Generate .env file
echo "⚙️  Generating environment configuration..."
generate_env_file

# Manage Docker stack
echo "📦 Managing Docker stack..."
manage_docker_stack

# Check service health
echo "🔍 Checking service health..."
check_service_health

# Display completion information
echo "🎉 Setup completed!"
display_completion_info
