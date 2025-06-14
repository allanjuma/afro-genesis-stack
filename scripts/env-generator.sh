
#!/bin/bash

# Environment Generator for Afro Network
# This script creates the .env configuration file

set -e

generate_env_file() {
    if [ ! -f .env ]; then
        echo "📝 Creating .env file..."
        cat > .env << EOF
# Afro Network Configuration
NETWORK_ID=7878
CHAIN_ID=7878
COIN=AFRO
COIN_NAME=Afro
NETWORK_NAME=Afro Network
SUBNETWORK=Afro Mainnet

# Mobile Money Integration
AFRO_MOBILE_MONEY_ENABLED=true
AFRO_SMS_VALIDATION=true
AFRO_ADDRESS_PREFIX=afro:254700000000:
AFRO_MOBILE_COUNTRY_CODE=254
AFRO_MOBILE_MONEY_CODE=700000000

# Testnet Configuration
TESTNET_NETWORK_ID=7879
TESTNET_CHAIN_ID=7879
TESTNET_COIN=tAFRO
TESTNET_COIN_NAME=Testnet Afro
TESTNET_NETWORK_NAME=Afro Testnet
TESTNET_SUBNETWORK=Afro Testnet

# Database Configuration
POSTGRES_DB=blockscout
POSTGRES_USER=blockscout
POSTGRES_PASSWORD=blockscout_password
TESTNET_POSTGRES_PASSWORD=blockscout_testnet_password

# Explorer Configuration
ETHEREUM_JSONRPC_VARIANT=geth
ETHEREUM_JSONRPC_HTTP_URL=http://afro-validator:8545
ETHEREUM_JSONRPC_WS_URL=ws://afro-validator:8546
TESTNET_ETHEREUM_JSONRPC_HTTP_URL=http://afro-testnet-validator:8547
TESTNET_ETHEREUM_JSONRPC_WS_URL=ws://afro-testnet-validator:8548

# CEO Agent Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
GITHUB_TOKEN=
GITHUB_REPO=afro-network/afro-blockchain

# Ports (modify if needed)
VALIDATOR_HTTP_PORT=8545
VALIDATOR_WS_PORT=8546
VALIDATOR_P2P_PORT=30303
TESTNET_VALIDATOR_HTTP_PORT=8547
TESTNET_VALIDATOR_WS_PORT=8548
TESTNET_VALIDATOR_P2P_PORT=30304
EXPLORER_PORT=4000
TESTNET_EXPLORER_PORT=4001
WEB_PORT=80
CEO_PORT=3000
EOF
        echo "✅ .env file created with mobile money support and CEO agent configuration"
    fi
}
