
#!/bin/bash

# Mobile Money SMS Integration Configuration
export AFRO_MOBILE_MONEY_ENABLED=true
export AFRO_SMS_VALIDATION=true
export AFRO_ADDRESS_PREFIX="afro:254700000000:"

# Create account if it doesn't exist
if [ ! -f /root/.ethereum/keystore/* ]; then
    echo "Creating validator account with mobile money support..."
    geth account new --password /dev/null
fi

echo "Starting Afro validator with mobile money integration..."
echo "Mobile Money Address Format: ${AFRO_ADDRESS_PREFIX}[extra_chars]"
echo "SMS Validation: ${AFRO_SMS_VALIDATION}"

# Start geth with all necessary configurations
exec geth \
    --networkid 7878 \
    --datadir /root/.ethereum \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8545 \
    --http.corsdomain "*" \
    --http.api "eth,net,web3,personal,admin,miner,afro" \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8546 \
    --ws.origins "*" \
    --ws.api "eth,net,web3,personal,admin,miner,afro" \
    --port 30303 \
    --mine \
    --miner.threads 1 \
    --miner.etherbase 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --unlock 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --password /dev/null \
    --allow-insecure-unlock \
    --nodiscover \
    --maxpeers 0 \
    --verbosity 3
