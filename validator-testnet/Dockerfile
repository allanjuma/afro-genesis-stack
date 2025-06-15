
FROM ethereum/client-go:latest

# Set network mode for testnet
ENV NETWORK_MODE=testnet

# Copy genesis configuration
COPY genesis-testnet.json /root/genesis.json

# Initialize the blockchain with genesis
RUN geth init /root/genesis.json

# Use the unified entrypoint script
COPY validator/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 30304 8547 8548

ENTRYPOINT ["/entrypoint.sh"]
