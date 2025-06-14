
// Faucet functionality
let isRequestInProgress = false;
let lastRequestTime = 0;
const RATE_LIMIT_MS = 60000; // 1 minute

// Testnet configuration
const TESTNET_CONFIG = {
    chainId: '0x1EC7', // 7879 in hex
    chainName: 'Afro Testnet',
    nativeCurrency: {
        name: 'Testnet Afro',
        symbol: 'tAFRO',
        decimals: 18
    },
    rpcUrls: ['http://localhost/rpc-testnet'],
    blockExplorerUrls: ['http://localhost:4001']
};

// Faucet wallet private key (for demo purposes - in production this would be on backend)
const FAUCET_PRIVATE_KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                document.getElementById('walletAddress').value = accounts[0];
                showStatus('Wallet connected successfully!', 'success');
                
                // Check if user is on the correct network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId !== TESTNET_CONFIG.chainId) {
                    showStatus('Please switch to Afro Testnet or click "Add Testnet to MetaMask"', 'warning');
                }
            }
        } catch (error) {
            showStatus('Failed to connect wallet: ' + error.message, 'error');
        }
    } else {
        showStatus('MetaMask is not installed. Please install MetaMask to continue.', 'error');
    }
}

async function addToMetaMask(network) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            if (network === 'testnet') {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [TESTNET_CONFIG]
                });
                showStatus('Afro Testnet added to MetaMask successfully!', 'success');
            }
        } catch (error) {
            showStatus('Failed to add network to MetaMask: ' + error.message, 'error');
        }
    } else {
        showStatus('MetaMask is not installed.', 'error');
    }
}

async function requestTokens() {
    if (isRequestInProgress) {
        showStatus('Request already in progress...', 'warning');
        return;
    }

    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_MS) {
        const remainingTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequestTime)) / 1000);
        showStatus(`Rate limit active. Please wait ${remainingTime} seconds.`, 'warning');
        return;
    }

    const address = document.getElementById('walletAddress').value.trim();
    if (!address) {
        showStatus('Please enter a wallet address', 'error');
        return;
    }

    // Convert afro: format to 0x format if needed
    const cleanAddress = address.startsWith('afro:') ? '0x' + address.slice(5) : address;
    
    // Basic address validation
    if (!cleanAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        showStatus('Invalid wallet address format', 'error');
        return;
    }

    isRequestInProgress = true;
    lastRequestTime = now;
    
    const requestBtn = document.getElementById('requestBtn');
    requestBtn.disabled = true;
    requestBtn.textContent = 'Requesting...';

    try {
        showStatus('Sending request to faucet...', 'info');
        
        // Send the actual transaction
        const response = await sendFaucetTransaction(cleanAddress);
        
        if (response.success) {
            showStatus(`Success! Sent 10 tAFRO to ${address}. Transaction hash: ${response.txHash}`, 'success');
            addRecentRequest(address, response.txHash, new Date().toISOString());
        } else {
            showStatus('Faucet request failed: ' + response.error, 'error');
        }
        
    } catch (error) {
        showStatus('Error requesting tokens: ' + error.message, 'error');
    } finally {
        isRequestInProgress = false;
        requestBtn.disabled = false;
        requestBtn.textContent = 'Request 10 tAFRO';
    }
}

async function sendFaucetTransaction(toAddress) {
    try {
        // Create transaction data
        const value = '0x8AC7230489E80000'; // 10 ETH in wei (hex)
        const gasLimit = '0x5208'; // 21000 in hex
        const gasPrice = await getGasPrice();
        const nonce = await getNonce();

        const transaction = {
            to: toAddress,
            value: value,
            gas: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce,
            data: '0x'
        };

        // Sign and send transaction
        const signedTx = await signTransaction(transaction);
        const txHash = await sendRawTransaction(signedTx);

        return {
            success: true,
            txHash: txHash,
            amount: '10',
            recipient: toAddress
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function getGasPrice() {
    try {
        const response = await fetch('/rpc-testnet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_gasPrice',
                params: [],
                id: 1
            })
        });
        
        const data = await response.json();
        return data.result || '0x3B9ACA00'; // Default to 1 Gwei
    } catch (error) {
        return '0x3B9ACA00'; // Default to 1 Gwei
    }
}

async function getNonce() {
    try {
        const faucetAddress = await getFaucetAddress();
        const response = await fetch('/rpc-testnet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionCount',
                params: [faucetAddress, 'pending'],
                id: 1
            })
        });
        
        const data = await response.json();
        return data.result || '0x0';
    } catch (error) {
        return '0x0';
    }
}

async function getFaucetAddress() {
    // In a real implementation, this would derive the address from the private key
    // For now, return a placeholder address
    return '0x742d35Cc6634C0532925a3b8D40000000000000000';
}

async function signTransaction(transaction) {
    // In a real implementation, this would use a proper signing library
    // For demo purposes, we'll use a placeholder
    // In production, this signing should happen on the backend for security
    throw new Error('Transaction signing not implemented - this should be done on the backend');
}

async function sendRawTransaction(signedTx) {
    const response = await fetch('/rpc-testnet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_sendRawTransaction',
            params: [signedTx],
            id: 1
        })
    });
    
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    return data.result;
}

// Check testnet connection on page load
async function checkTestnetConnection() {
    try {
        const response = await fetch('/rpc-testnet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            })
        });
        
        const data = await response.json();
        if (data.result) {
            const blockNumber = parseInt(data.result, 16);
            showStatus(`Connected to Afro Testnet! Current block: ${blockNumber}`, 'success');
        } else {
            showStatus('Unable to connect to Afro Testnet', 'error');
        }
    } catch (error) {
        showStatus('Testnet connection error: ' + error.message, 'error');
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('faucetStatus');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    
    // Auto-hide after 10 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 10000);
    }
}

function addRecentRequest(address, txHash, timestamp) {
    const recentRequestsDiv = document.getElementById('recentRequests');
    const requestElement = document.createElement('div');
    requestElement.className = 'request-item';
    
    const shortAddress = address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
    const shortTxHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
    const time = new Date(timestamp).toLocaleTimeString();
    
    requestElement.innerHTML = `
        <div class="request-info">
            <span class="address">${shortAddress}</span>
            <span class="amount">10 tAFRO</span>
            <span class="time">${time}</span>
        </div>
        <div class="tx-hash">
            <a href="http://localhost:4001/tx/${txHash}" target="_blank">${shortTxHash}</a>
        </div>
    `;
    
    recentRequestsDiv.insertBefore(requestElement, recentRequestsDiv.firstChild);
    
    // Keep only the last 5 requests visible
    const requests = recentRequestsDiv.children;
    while (requests.length > 5) {
        recentRequestsDiv.removeChild(requests[requests.length - 1]);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkTestnetConnection();
});
