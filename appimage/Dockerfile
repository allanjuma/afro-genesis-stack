
FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    fuse \
    libfuse2 \
    file \
    desktop-file-utils \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js v18 via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install AppImageTool
RUN wget -O /usr/local/bin/appimagetool \
    https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage \
    && chmod +x /usr/local/bin/appimagetool

# Set working directory
WORKDIR /workspace

# Copy package files first for better caching
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build script
COPY appimage/build-appimage.sh /usr/local/bin/build-appimage.sh
RUN chmod +x /usr/local/bin/build-appimage.sh

# Create output directory
RUN mkdir -p /output

# Set environment variables
ENV ARCH=x86_64
ENV APPIMAGE_EXTRACT_AND_RUN=1

# Default command
CMD ["/usr/local/bin/build-appimage.sh"]
