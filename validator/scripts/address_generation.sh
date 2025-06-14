
#!/bin/bash

# Address generation logic for Afro Network Validator

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

            echo "✅ Address generation successful! Validator earned 10 AFRO (distribution deferred until block/network confirmation)"
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
