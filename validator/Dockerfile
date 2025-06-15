
FROM ethereum/client-go:latest

# Set network mode for mainnet
ENV NETWORK_MODE=mainnet

# Copy genesis configuration
COPY validator/genesis.json /root/genesis.json

# Initialize the blockchain with genesis
RUN geth init /root/genesis.json

# Create entrypoint script
COPY validator/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 30303 8545 8546

ENTRYPOINT ["/entrypoint.sh"]
