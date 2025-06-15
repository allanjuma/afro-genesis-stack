
FROM ethereum/client-go:latest

# Set network mode for testnet
ENV NETWORK_MODE=testnet

# Install bash
RUN apk add --no-cache bash

# Copy genesis configuration
COPY validator-testnet/genesis-testnet.json /root/genesis.json

# Initialize the blockchain with genesis
RUN geth init /root/genesis.json

# Use the unified entrypoint script
COPY validator/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 30304 8547 8548

ENTRYPOINT ["/entrypoint.sh"]
