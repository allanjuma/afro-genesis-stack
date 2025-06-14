
#!/bin/bash

# Mobile Money SMS Integration Configuration
export AFRO_MOBILE_MONEY_ENABLED=true
export AFRO_SMS_VALIDATION=true
export AFRO_ADDRESS_PREFIX="afro:"
export AFRO_SMS_API_URL="http://localhost:3001/sms"
export AFRO_SMS_TIMEOUT=30

# Address generation function with brute-force search
generate_afro_address() {
    local msisdn=$1
    local prefix="afro:${msisdn}:"
    local max_attempts=1000000
    local attempt=0
    
    echo "Generating testnet address for MSISDN: ${msisdn}"
    echo "Target prefix: ${prefix}"
    
    while [ $attempt -lt $max_attempts ]; do
        # Generate random extra characters (32 hex chars for compatibility)
        extra_chars=$(openssl rand -hex 16)
        candidate_address="${prefix}${extra_chars}"
        
        # Convert to 0x format for validation
        eth_address="0x${extra_chars}"
        
        # Validate if this forms a valid Ethereum address
        if geth account validate-address "$eth_address" 2>/dev/null; then
            echo "Valid testnet address generated: ${candidate_address}"
            echo "Ethereum compatible: ${eth_address}"
            
            # Send SMS with extra characters for validation
            send_sms_validation "$msisdn" "$extra_chars"
            
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
    
    echo "Sending testnet SMS validation to: ${phone_number}"
    echo "Validation code: ${validation_code}"
    echo "OTP: ${otp}"
    
    # Send SMS via API (mock implementation)
    curl -X POST "$AFRO_SMS_API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"${phone_number}\",
            \"message\": \"Your Afro testnet address validation code: ${otp}. Extra chars: ${validation_code}\",
            \"type\": \"testnet_address_validation\"
        }" \
        --timeout "$AFRO_SMS_TIMEOUT" || echo "SMS sending failed (API not available)"
}

# Peer node phone number registry
register_validator_phone() {
    local validator_phone="254700000002"  # Example testnet validator phone
    echo "Registering testnet validator phone: ${validator_phone}"
    
    # Share phone number with peer nodes (mock implementation)
    echo "${validator_phone}" > /root/.ethereum/validator_phone.txt
    
    # Broadcast to network (would be implemented via P2P protocol)
    echo "Broadcasting testnet validator phone to peer network..."
}

# Create account if it doesn't exist
if [ ! -f /root/.ethereum/keystore/* ]; then
    echo "Creating testnet validator account with mobile money support..."
    geth account new --password /dev/null
fi

# Register this validator's phone number
register_validator_phone

echo "Starting Afro testnet validator with enhanced mobile money integration..."
echo "Address Format: afro:[MSISDN]:[extra_characters]"
echo "SMS Validation: ${AFRO_SMS_VALIDATION}"
echo "Address Generation: Brute-force search enabled"

# Example address generation for testing
echo "Testing testnet address generation..."
test_msisdn="254700000000"
if test_address=$(generate_afro_address "$test_msisdn"); then
    echo "Test testnet address generated successfully: $test_address"
else
    echo "Test testnet address generation failed"
fi

# Start geth with all necessary configurations for testnet
exec geth \
    --networkid 7879 \
    --datadir /root/.ethereum \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8547 \
    --http.corsdomain "*" \
    --http.api "eth,net,web3,personal,admin,miner,afro" \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8548 \
    --ws.origins "*" \
    --ws.api "eth,net,web3,personal,admin,miner,afro" \
    --port 30304 \
    --mine \
    --miner.threads 1 \
    --miner.etherbase 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --unlock 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    --password /dev/null \
    --allow-insecure-unlock \
    --nodiscover \
    --maxpeers 0 \
    --verbosity 3
