
#!/bin/bash

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
