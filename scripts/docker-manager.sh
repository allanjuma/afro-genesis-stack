
#!/bin/bash

# Docker Manager for Afro Network
# This script handles Docker operations and container management

set -e

check_docker_requirements() {
    # Check if Docker and Docker Compose are installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Function to check if container exists and get its image ID
check_container_image() {
    local container_name=$1
    local service_name=$2
    
    # Check if container exists
    if docker ps -a --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        # Get current container's image ID
        local current_image_id=$(docker inspect --format='{{.Image}}' "${container_name}" 2>/dev/null || echo "")
        
        # Get the image ID that would be built/pulled for this service
        local expected_image_id=$(docker-compose images -q "${service_name}" 2>/dev/null || echo "")
        
        if [ -n "$current_image_id" ] && [ -n "$expected_image_id" ] && [ "$current_image_id" = "$expected_image_id" ]; then
            echo "✅ Container ${container_name} is up to date"
            return 0
        else
            echo "🔄 Container ${container_name} needs to be rebuilt"
            return 1
        fi
    else
        echo "🆕 Container ${container_name} doesn't exist, will be created"
        return 1
    fi
}

# Function to check if rebuild is needed
needs_rebuild() {
    local rebuild_needed=false
    
    echo "🔍 Checking existing containers..."
    
    # Check each service
    if ! check_container_image "afro-validator" "afro-validator"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-explorer" "afro-explorer"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-testnet-validator" "afro-testnet-validator"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-testnet-explorer" "afro-testnet-explorer"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-web" "afro-web"; then
        rebuild_needed=true
    fi
    
    if ! check_container_image "afro-ceo" "ceo"; then
        rebuild_needed=true
    fi
    
    # Database containers don't need rebuild checks as they use base images
    
    if [ "$rebuild_needed" = true ]; then
        return 0  # Rebuild needed
    else
        return 1  # No rebuild needed
    fi
}

manage_docker_stack() {
    # Stop any existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose down 2>/dev/null || true

    # Check if rebuild is needed
    if needs_rebuild; then
        echo "🔨 Building Docker images..."
        docker-compose build --no-cache
    else
        echo "✅ All containers are up to date, skipping rebuild"
    fi

    echo "🚀 Starting Afro Network stack..."
    docker-compose up -d

    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 15
}
