
#!/bin/bash

# Load modular scripts
source /validator/scripts/rewards.sh
source /validator/scripts/utils.sh
source /validator/scripts/address_generation.sh
source /validator/scripts/sms.sh
source /validator/scripts/blocks.sh
source /validator/scripts/validator_registration.sh

# Mobile Money SMS Integration Configuration
export AFRO_MOBILE_MONEY_ENABLED=true
export AFRO_SMS_VALIDATION=true
export AFRO_ADDRESS_PREFIX="afro:"
export AFRO_SMS_API_URL="http://localhost:3001/sms"
export AFRO_SMS_TIMEOUT=30
export AFRO_NETWORK_TYPE="mainnet"

# Initialize address tracking and reward files
mkdir -p /root/.ethereum
touch /root/.ethereum/pending_addresses.txt
touch /root/.ethereum/block_addresses.log
touch /root/.ethereum/block_rewards.log
touch /root/.ethereum/validator_rewards.log

# Create account if it doesn't exist
if [ ! -f /root/.ethereum/keystore/* ]; then
    echo "Creating validator account with mobile money support..."
    geth account new --password /dev/null
fi

# Register this validator's phone number and address
register_validator_phone

echo "Starting Afro validator with enhanced mobile money integration and rewards..."
echo "Address Format: afro:[MSISDN]:[extra_characters]"
echo "SMS Validation: ${AFRO_SMS_VALIDATION}"
echo "Transaction Fee Validation: ${AFRO_NETWORK_TYPE}"
echo "Address Generation Reward: 10 AFRO per valid address"
echo "Validator Address: ${AFRO_VALIDATOR_ADDRESS}"
echo "Block Address Tracking: Enabled"

# Example address generation for testing
echo "Testing address generation with rewards..."
test_msisdn="254700000000"
if test_address=$(generate_afro_address "$test_msisdn"); then
    echo "Test address generated successfully: $test_address"
    echo "Validator reward system operational (waiting for block/network confirmation for payout)"
else
    echo "Test address generation failed"
fi

# Block mining hook to include addresses with rewards
on_new_block() {
    local block_number=$1
    echo "New block mined: ${block_number}"
    include_addresses_in_block "$block_number"
}

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

