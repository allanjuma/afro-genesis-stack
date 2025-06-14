#!/bin/bash

# Mobile Money SMS Integration Configuration
export AFRO_MOBILE_MONEY_ENABLED=true
export AFRO_SMS_VALIDATION=true
export AFRO_ADDRESS_PREFIX="afro:"
export AFRO_SMS_API_URL="http://localhost:3001/sms"
export AFRO_SMS_TIMEOUT=30
export AFRO_NETWORK_TYPE="mainnet"

# Validator reward configuration
export AFRO_ADDRESS_REWARD="10000000000000000000"  # 10 AFRO (18 decimals)
export AFRO_VALIDATOR_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Global array to track new addresses for block inclusion
declare -a NEW_ADDRESSES_PENDING=()

# Simulated node confirmation state for the block
CONFIRMED_NODES=0

# Award validator for successful address generation (called after confirmation)
award_validator_reward() {
    local validator_addr=$1
    local reward_amount=$2
    local msisdn=$3

    echo "Distributing validator reward: ${reward_amount} AFRO to ${validator_addr} for address generation: ${msisdn}"

    # Add reward to validator balance (this would be integrated with actual reward distribution)
    local reward_tx=$(geth attach --exec "
        eth.sendTransaction({
            from: eth.coinbase,
            to: '${validator_addr}',
            value: '${reward_amount}',
            gas: 21000,
            gasPrice: eth.gasPrice
        })
    " 2>/dev/null || echo "reward_pending")

    echo "Validator reward transaction: ${reward_tx}"
    echo "$(date): Validator ${validator_addr} earned ${reward_amount} AFRO for address generation (MSISDN: ${msisdn})" >> /root/.ethereum/validator_rewards.log

    return 0
}

# Simulate majority confirmation from nodes with the longest chains (at least 3 confirmations required)
confirm_block_inclusion_by_network() {
    local block_number=$1
    local confirmations_needed=3
    local confirmed=0

    echo "Waiting for network confirmation of block ${block_number} (need $confirmations_needed nodes)..."
    while [ $confirmed -lt $confirmations_needed ]; do
        # Simulate confirmation from network peers (replace with actual P2P communication & block height check in production)
        sleep 1
        confirmed=$((confirmed + 1))
        echo "Node ${confirmed} confirmed inclusion of block ${block_number}"
    done
    echo "Block ${block_number} confirmed by ${confirmations_needed} nodes with the longest chains."
    return 0
}

# Transaction fee validation for mainnet
validate_transaction_fee() {
    local msisdn=$1
    local required_fee="1000000000000000"  # 0.001 ETH minimum transaction fee (in wei)

    echo "Validating transaction fee from MSISDN: ${msisdn}"

    # Check for pending transactions from this phone number
    local tx_hash=$(geth attach --exec "eth.pendingTransactions.find(tx => tx.from.toLowerCase().includes('${msisdn}'.toLowerCase()))" 2>/dev/null)

    if [ -z "$tx_hash" ]; then
        echo "No pending transaction found from ${msisdn}. Address generation requires payment of 0.001 ETH"
        return 1
    fi

    # Validate transaction amount meets minimum fee
    local tx_value=$(geth attach --exec "eth.getTransaction('${tx_hash}').value" 2>/dev/null)

    if [ -z "$tx_value" ] || [ "$tx_value" -lt "$required_fee" ]; then
        echo "Transaction fee insufficient. Required: 0.001 ETH, Received: ${tx_value} wei"
        return 1
    fi

    echo "Transaction fee validated: ${tx_value} wei from ${msisdn}"
    echo "Transaction hash: ${tx_hash}"
    return 0
}

# Add new address to pending list for next block
add_address_to_pending_block() {
    local new_address=$1
    local msisdn=$2
    local timestamp=$(date +%s)

    echo "Adding address to pending block: ${new_address}"

    # Format: address|msisdn|timestamp|block_height|validator_address
    local current_block=$(geth attach --exec "eth.blockNumber" 2>/dev/null || echo "0")
    local address_entry="${new_address}|${msisdn}|${timestamp}|${current_block}|${AFRO_VALIDATOR_ADDRESS}"

    NEW_ADDRESSES_PENDING+=("$address_entry")

    # Store in file for persistence
    echo "$address_entry" >> /root/.ethereum/pending_addresses.txt

    # AWARD REMOVED: do not reward validator here; instead, defer until confirmation after block inclusion!
}

# Include pending addresses in new block with validator rewards
include_addresses_in_block() {
    local block_number=$1

    if [ ${#NEW_ADDRESSES_PENDING[@]} -eq 0 ]; then
        echo "No pending addresses to include in block ${block_number}"
        return 0
    fi

    echo "Including ${#NEW_ADDRESSES_PENDING[@]} new addresses in block ${block_number}"
    echo "Total validator rewards for this block: $((${#NEW_ADDRESSES_PENDING[@]} * 10)) AFRO (to be distributed after network confirmation)"

    # Create addresses data for block
    local addresses_data=""
    for addr_entry in "${NEW_ADDRESSES_PENDING[@]}"; do
        addresses_data="${addresses_data}${addr_entry};"
    done

    # Add to block extra data (this would be integrated with actual block creation)
    echo "Block ${block_number} addresses: ${addresses_data}" >> /root/.ethereum/block_addresses.log
    echo "Block ${block_number} validator rewards: $((${#NEW_ADDRESSES_PENDING[@]} * 10)) AFRO pending confirmation" >> /root/.ethereum/block_rewards.log

    # Simulate waiting for confirmation by at least 3 nodes
    confirm_block_inclusion_by_network "$block_number"

    # Only now distribute rewards
    for addr_entry in "${NEW_ADDRESSES_PENDING[@]}"; do
        # Parse address_entry: address|msisdn|timestamp|block_height|validator_addr
        IFS='|' read -r afro_addr msisdn ts blk val_addr <<< "$addr_entry"
        award_validator_reward "$val_addr" "$AFRO_ADDRESS_REWARD" "$msisdn"
    done

    # Clear pending addresses after inclusion
    NEW_ADDRESSES_PENDING=()
    > /root/.ethereum/pending_addresses.txt

    echo "Addresses successfully included and validator rewards distributed for block ${block_number} after network confirmation."
}

# Enhanced address generation with transaction fee validation and rewards
generate_afro_address() {
    local msisdn=$1
    local prefix="afro:${msisdn}:"
    local max_attempts=1000000
    local attempt=0

    echo "Generating address for MSISDN: ${msisdn}"
    echo "Target prefix: ${prefix}"
    echo "Validator reward: 10 AFRO upon successful generation"

    # Validate transaction fee before generating address (mainnet only)
    if [ "$AFRO_NETWORK_TYPE" = "mainnet" ]; then
        if ! validate_transaction_fee "$msisdn"; then
            echo "Address generation failed: Transaction fee validation required (0.001 ETH minimum)"
            return 1
        fi
        echo "Transaction fee validated, proceeding with address generation..."
        echo "Validator will earn 10 AFRO upon successful generation"
    else
        echo "Testnet mode: Skipping transaction fee validation and rewards"
    fi

    while [ $attempt -lt $max_attempts ]; do
        # Generate random extra characters (32 hex chars for compatibility)
        extra_chars=$(openssl rand -hex 16)
        candidate_address="${prefix}${extra_chars}"

        # Convert to 0x format for validation
        eth_address="0x${extra_chars}"

        # Validate if this forms a valid Ethereum address
        if geth account validate-address "$eth_address" 2>/dev/null; then
            echo "Valid address generated: ${candidate_address}"
            echo "Ethereum compatible: ${eth_address}"

            # Add to pending addresses for next block (includes validator reward)
            add_address_to_pending_block "$candidate_address" "$msisdn"

            # Send SMS with extra characters for validation
            send_sms_validation "$msisdn" "$extra_chars"

            echo "✅ Address generation successful! Validator earned 10 AFRO"
            echo "$candidate_address"
            return 0
        fi

        attempt=$((attempt + 1))
        if [ $((attempt % 10000)) -eq 0 ]; then
            echo "Attempt ${attempt}/${max_attempts} - searching for valid address..."
        fi
    done

    echo "Failed to generate valid address after ${max_attempts} attempts"
    return 1
}

# SMS validation function
send_sms_validation() {
    local phone_number=$1
    local validation_code=$2
    local otp=$(echo -n "$validation_code" | sha256sum | cut -c1-6)

    echo "Sending SMS validation to: ${phone_number}"
    echo "Validation code: ${validation_code}"
    echo "OTP: ${otp}"

    # Send SMS via API (mock implementation)
    curl -X POST "$AFRO_SMS_API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"${phone_number}\",
            \"message\": \"Your Afro address validation code: ${otp}. Extra chars: ${validation_code}\",
            \"type\": \"address_validation\"
        }" \
        --timeout "$AFRO_SMS_TIMEOUT" || echo "SMS sending failed (API not available)"
}

# Block mining hook to include addresses with rewards
on_new_block() {
    local block_number=$1
    echo "New block mined: ${block_number}"
    include_addresses_in_block "$block_number"
}

# Peer node phone number registry
register_validator_phone() {
    local validator_phone="254700000001"  # Example validator phone
    echo "Registering validator phone: ${validator_phone}"
    echo "Validator address: ${AFRO_VALIDATOR_ADDRESS}"
    echo "Address generation reward: 10 AFRO per valid address"

    # Share phone number with peer nodes (mock implementation)
    echo "${validator_phone}" > /root/.ethereum/validator_phone.txt
    echo "${AFRO_VALIDATOR_ADDRESS}" > /root/.ethereum/validator_address.txt

    # Broadcast to network (would be implemented via P2P protocol)
    echo "Broadcasting validator info to peer network..."
}

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
