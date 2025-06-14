// Faucet functionality
let isRequestInProgress = false;
let lastRequestTime = 0;
const RATE_LIMIT_MS = 60000; // 1 minute

async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                document.getElementById('walletAddress').value = accounts[0];
                showStatus('Wallet connected successfully!', 'success');
            }
        } catch (error) {
            showStatus('Failed to connect wallet: ' + error.message, 'error');
        }
    } else {
        showStatus('MetaMask is not installed. Please install MetaMask to continue.', 'error');
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
        // Simulate faucet request (in a real implementation, this would call a backend service)
        showStatus('Sending request to faucet...', 'info');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes, we'll simulate success
        // In production, you'd call your faucet backend service here
        const response = await simulateFaucetRequest(cleanAddress);
        
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

async function simulateFaucetRequest(address) {
    // This is a simulation - in production, you'd implement actual faucet logic
    // that interacts with your testnet validator to send tokens
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
        const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return {
            success: true,
            txHash: txHash,
            amount: '10',
            recipient: address
        };
    } else {
        return {
            success: false,
            error: 'Daily limit exceeded for this address'
        };
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

// Initialize recent requests on page load
document.addEventListener('DOMContentLoaded', function() {
    // You could load recent requests from localStorage or an API here
    showStatus('Faucet ready! Enter your address to request test tokens.', 'info');
});
