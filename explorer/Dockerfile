
FROM elixir:1.15

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    npm \
    git \
    postgresql-client \
    curl \
    inotify-tools \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone Blockscout
RUN git clone https://github.com/blockscout/blockscout.git . && \
    git checkout v5.3.3

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Copy custom configuration
COPY config.exs /app/config/prod.exs
COPY address_formatter.js /app/apps/block_scout_web/assets/js/lib/address_formatter.js

# Install dependencies
RUN mix deps.get --only prod

# Install npm dependencies
RUN cd apps/block_scout_web/assets && npm install

# Compile assets
RUN cd apps/block_scout_web/assets && npm run build

# Compile application
RUN MIX_ENV=prod mix compile

# Create release
RUN MIX_ENV=prod mix release blockscout

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
