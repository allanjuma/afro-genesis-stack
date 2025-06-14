
#!/bin/bash

# Afro Network Docker Stack Setup Script
# This script sets up the complete Afro blockchain infrastructure

set -e

# Source utility scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/scripts/appimage-builder.sh"
source "${SCRIPT_DIR}/scripts/env-generator.sh"
source "${SCRIPT_DIR}/scripts/docker-manager.sh"
source "${SCRIPT_DIR}/scripts/health-checker.sh"

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

# Handle AppImage-only mode
if [ "$APPIMAGE_ONLY" = true ]; then
    build_appimage
    exit 0
fi

# Full setup mode
echo "🚀 Setting up Afro Network Docker Stack..."

# Check Docker requirements
check_docker_requirements

# Generate .env file
generate_env_file

# Manage Docker stack
manage_docker_stack

# Check service health
check_service_health

# Display completion information
display_completion_info
