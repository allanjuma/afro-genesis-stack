#!/bin/bash

IPC_PATH="/root/.ethereum/geth.ipc"

# Helper to execute commands on the running geth node
g_exec() {
    geth attach "$IPC_PATH" --exec "$1" 2>/dev/null
}

# ---------------------------------------------------------------- #
#                  INLINED VALIDATOR FUNCTIONS                     #
# ---------------------------------------------------------------- #

# --- Inlined from validator/scripts/rewards.sh ---
AFRO_ADDRESS_REWARD="10000000000000000000"  # 10 AFRO (18 decimals)

# Award validator for successful address generation (called after block/network confirmation)
award_validator_reward() {
    local validator_addr=$1
    local reward_amount=$2
    local msisdn=$3

    echo "Distributing validator reward: ${reward_amount} AFRO to ${validator_addr} for address generation: ${msisdn}"
    local reward_tx=$(g_exec "
        eth.sendTransaction({
            from: eth.coinbase,
            to: '${validator_addr}',
            value: '${reward_amount}',
            gas: 21000,
            gasPrice: eth.gasPrice
        })
    " || echo "reward_pending")

    echo "Validator reward transaction: ${reward_tx}"
    echo "$(date): Validator ${validator_addr} earned ${reward_amount} AFRO for address generation (MSISDN: ${msisdn})" >> /root/.ethereum/validator_rewards.log
    return 0
}

# --- Inlined from validator/scripts/utils.sh ---
validate_transaction_fee() {
    local msisdn=$1
    local required_fee="1000000000000000"  # 0.001 ETH minimum transaction fee (in wei)
    echo "Validating transaction fee from MSISDN: ${msisdn}"
    local tx_hash=$(g_exec "eth.pendingTransactions.find(tx => tx.from.toLowerCase().includes('${msisdn}'.toLowerCase()))")
    if [ -z "$tx_hash" ]; then
        echo "No pending transaction found from ${msisdn}. Address generation requires payment of 0.001 ETH"
        return 1
    fi
    local tx_value=$(g_exec "eth.getTransaction('${tx_hash}').value")
    if [ -z "$tx_value" ] || [ "$tx_value" -lt "$required_fee" ]; then
        echo "Transaction fee insufficient. Required: 0.001 ETH, Received: ${tx_value} wei"
        return 1
    fi
    echo "Transaction fee validated: ${tx_value} wei from ${msisdn}"
    echo "Transaction hash: ${tx_hash}"
    return 0
}

# --- Inlined from validator/scripts/sms.sh ---
send_sms_validation() {
    local phone_number=$1
    local validation_code=$2
    local otp=$(echo -n "$validation_code" | sha256sum | cut -c1-6)
    echo "Sending SMS validation to: ${phone_number}"
    echo "OTP: ${otp}"
    curl -X POST "$AFRO_SMS_API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"${phone_number}\",
            \"message\": \"Your Afro address validation code: ${otp}. Extra chars: ${validation_code}\",
            \"type\": \"address_validation\"
        }" \
        --timeout "$AFRO_SMS_TIMEOUT" || echo "SMS sending failed (API not available)"
}

# --- Inlined from validator/scripts/blocks.sh ---
NEW_ADDRESSES_PENDING=()

add_address_to_pending_block() {
    local new_address=$1
    local msisdn=$2
    local timestamp=$(date +%s)
    echo "Adding address to pending block: ${new_address}"
    local current_block=$(g_exec "eth.blockNumber" || echo "0")
    local address_entry="${new_address}|${msisdn}|${timestamp}|${current_block}|${AFRO_VALIDATOR_ADDRESS}"
    NEW_ADDRESSES_PENDING+=("$address_entry")
    echo "$address_entry" >> /root/.ethereum/pending_addresses.txt
}

confirm_block_inclusion_by_network() {
    local block_number=$1
    local confirmations_needed=3
    local confirmed=0
    echo "Waiting for network confirmation of block ${block_number} (need $confirmations_needed nodes)..."
    while [ $confirmed -lt $confirmations_needed ]; do
        sleep 1
        confirmed=$((confirmed + 1))
        echo "Node ${confirmed} confirmed inclusion of block ${block_number}"
    done
    echo "Block ${block_number} confirmed by ${confirmations_needed} nodes with the longest chains."
    return 0
}

include_addresses_in_block() {
    local block_number=$1
    if [ ${#NEW_ADDRESSES_PENDING[@]} -eq 0 ]; then
        echo "No pending addresses to include in block ${block_number}"
        return 0
    fi
    echo "Including ${#NEW_ADDRESSES_PENDING[@]} new addresses in block ${block_number}"
    local addresses_data=""
    for addr_entry in "${NEW_ADDRESSES_PENDING[@]}"; do
        addresses_data="${addresses_data}${addr_entry};"
    done
    echo "Block ${block_number} addresses: ${addresses_data}" >> /root/.ethereum/block_addresses.log
    confirm_block_inclusion_by_network "$block_number"
    for addr_entry in "${NEW_ADDRESSES_PENDING[@]}"; do
        IFS='|' read -r afro_addr msisdn ts blk val_addr <<< "$addr_entry"
        award_validator_reward "$val_addr" "$AFRO_ADDRESS_REWARD" "$msisdn"
    done
    NEW_ADDRESSES_PENDING=()
    > /root/.ethereum/pending_addresses.txt
    echo "Addresses successfully included and validator rewards distributed for block ${block_number}."
}

# --- Inlined from validator/scripts/address_generation.sh ---
generate_afro_address() {
    local msisdn=$1
    local prefix="afro:${msisdn}:"
    local max_attempts=1000000
    local attempt=0
    echo "Generating address for MSISDN: ${msisdn}"

    if [ "$AFRO_NETWORK_TYPE" = "mainnet" ]; then
        if ! validate_transaction_fee "$msisdn"; then
            echo "Address generation failed: Transaction fee validation required (0.001 ETH minimum)"
            return 1
        fi
    fi

    while [ $attempt -lt $max_attempts ]; do
        local extra_chars=$(openssl rand -hex 16)
        local candidate_address="${prefix}${extra_chars}"
        local eth_address="0x${extra_chars}"
        if geth account validate-address "$eth_address" 2>/dev/null; then
            echo "Valid address generated: ${candidate_address}"
            add_address_to_pending_block "$candidate_address" "$msisdn"
            send_sms_validation "$msisdn" "$extra_chars"
            echo "$candidate_address"
            return 0
        fi
        attempt=$((attempt + 1))
    done
    echo "Failed to generate valid address after ${max_attempts} attempts"
    return 1
}

# --- Inlined from validator/scripts/validator_registration.sh ---
register_validator_phone() {
    local validator_phone="254700000001"
    echo "Registering validator phone: ${validator_phone}"
    echo "${validator_phone}" > /root/.ethereum/validator_phone.txt
    echo "${AFRO_VALIDATOR_ADDRESS}" > /root/.ethereum/validator_address.txt
    echo "Broadcasting validator info to peer network..."
}


# ---------------------------------------------------------------- #
#                     UNIFIED CONFIGURATION                        #
# ---------------------------------------------------------------- #

if [ "$NETWORK_MODE" = "testnet" ]; then
    # Testnet Configuration
    export AFRO_NETWORK_TYPE="testnet"
    export AFRO_BOOTSTRAP_DOMAIN="afro-testnet.bitsoko.org"
    export AFRO_BOOTSTRAP_PORT=30304
    NETWORK_ID=7879
    RPC_PORT=8547
    WS_PORT=8548
    P2P_PORT=30304
    export AFRO_VALIDATOR_ADDRESS="0xbCD4042DE499D14e55001CcbB24a551F3b954096" # Testnet validator address
    echo "🚀 Starting Afro Validator in TESTNET mode"
else
    # Mainnet Configuration (default)
    export AFRO_NETWORK_TYPE="mainnet"
    export AFRO_BOOTSTRAP_DOMAIN="afro-mainnet.bitsoko.org"
    export AFRO_BOOTSTRAP_PORT=30303
    NETWORK_ID=7878
    RPC_PORT=8545
    WS_PORT=8546
    P2P_PORT=30303
    export AFRO_VALIDATOR_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Mainnet validator address
    echo "🚀 Starting Afro Validator in MAINNET mode"
fi

# Shared Configuration
export AFRO_MOBILE_MONEY_ENABLED=true
export AFRO_SMS_VALIDATION=true
export AFRO_ADDRESS_PREFIX="afro:"
export AFRO_SMS_API_URL="http://localhost:3001/sms"
export AFRO_SMS_TIMEOUT=30

# Initialize files and folders
mkdir -p /root/.ethereum
touch /root/.ethereum/pending_addresses.txt
touch /root/.ethereum/block_addresses.log
touch /root/.ethereum/block_rewards.log
touch /root/.ethereum/validator_rewards.log

# Create account if it doesn't exist
if [ ! -d /root/.ethereum/keystore ] || [ -z "$(ls -A /root/.ethereum/keystore)" ]; then
    echo "Creating new account..."
    geth account new --datadir /root/.ethereum --password /dev/null
fi

register_validator_phone

echo "Starting Afro validator..."
echo "Network Type: ${AFRO_NETWORK_TYPE}"
echo "Validator Address: ${AFRO_VALIDATOR_ADDRESS}"

# Start geth in the background
echo "🚀 Starting geth node in background..."

# Use a static/fallback bootnode, or omit if not needed. This avoids the buggy .tmp IPC usage.
GETH_BOOTNODES_ARG=""
if [ -n "$AFRO_BOOTSTRAP_DOMAIN" ]; then
    GETH_BOOTNODES_ARG="--bootnodes enode://00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000@${AFRO_BOOTSTRAP_DOMAIN}:${P2P_PORT}"
fi

geth \
    --networkid ${NETWORK_ID} \
    --datadir /root/.ethereum \
    --http \
    --http.addr 0.0.0.0 \
    --http.port ${RPC_PORT} \
    --http.corsdomain "*" \
    --http.api "eth,net,web3,personal,admin,miner,afro" \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port ${WS_PORT} \
    --ws.origins "*" \
    --ws.api "eth,net,web3,personal,admin,miner,afro" \
    --port ${P2P_PORT} \
    $GETH_BOOTNODES_ARG \
    --syncmode "full" \
    --maxpeers 25 \
    --mine \
    --miner.etherbase ${AFRO_VALIDATOR_ADDRESS} \
    --unlock ${AFRO_VALIDATOR_ADDRESS} \
    --password /dev/null \
    --allow-insecure-unlock \
    --verbosity 3 &

GETH_PID=$!
echo "Geth started with PID: $GETH_PID"

echo "Waiting for Geth RPC to be available..."
# Wait for the IPC file to be created before proceeding
while [ ! -e "$IPC_PATH" ]; do
    if ! kill -0 $GETH_PID 2>/dev/null; then
        echo "Geth process appears to have died. Exiting."
        exit 1
    fi
    echo "Waiting for Geth IPC file at $IPC_PATH..."
    sleep 2
done
echo "Geth IPC file found. Geth is likely running."
sleep 5 # Extra grace period for RPC to be fully ready

# Main loop to process new blocks
LATEST_PROCESSED_BLOCK=$(g_exec "eth.blockNumber" || echo 0)
echo "Starting block processing from block: $LATEST_PROCESSED_BLOCK"

while true; do
    # Check if geth is still running
    if ! kill -0 $GETH_PID 2>/dev/null; then
        echo "Geth process not found. Exiting."
        exit 1
    fi

    CURRENT_BLOCK=$(g_exec "eth.blockNumber")

    if [ -n "$CURRENT_BLOCK" ] && [ "$CURRENT_BLOCK" -gt "$LATEST_PROCESSED_BLOCK" ]; then
        echo "New blocks detected. Processing from block $((LATEST_PROCESSED_BLOCK + 1)) to ${CURRENT_BLOCK}"
        for block_num in $(seq $((LATEST_PROCESSED_BLOCK + 1)) $CURRENT_BLOCK); do
            echo "Processing block: ${block_num}"
            include_addresses_in_block "$block_num"
        done
        LATEST_PROCESSED_BLOCK=$CURRENT_BLOCK
    fi
    sleep 15 # Check for new blocks every 15 seconds
done

wait $GETH_PID
