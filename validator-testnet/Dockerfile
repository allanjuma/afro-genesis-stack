
FROM ethereum/client-go:latest

# Copy genesis configuration
COPY genesis-testnet.json /root/genesis.json

# Initialize the blockchain with genesis
RUN geth init /root/genesis.json

# Create entrypoint script
COPY entrypoint-testnet.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 30304 8547 8548

ENTRYPOINT ["/entrypoint.sh"]
