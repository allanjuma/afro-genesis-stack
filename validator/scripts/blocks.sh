
#!/bin/bash

# Block-level address aggregation, confirmation & rewards

NEW_ADDRESSES_PENDING=()

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
    # Rewards awarded later after block/network confirmation
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

# Include pending addresses in new block and reward validators after confirmation
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
