
// MetaMask integration for Afro Network
async function addToMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x1ECE', // 7878 in hex
                    chainName: 'Afro Network',
                    nativeCurrency: {
                        name: 'Afro',
                        symbol: 'AFRO',
                        decimals: 18
                    },
                    rpcUrls: ['http://localhost:8545'],
                    blockExplorerUrls: ['http://localhost:4000']
                }]
            });
            
            alert('Afro Network has been added to MetaMask!');
        } catch (error) {
            console.error('Failed to add network:', error);
            alert('Failed to add network to MetaMask. Please add manually.');
        }
    } else {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        window.open('https://metamask.io/', '_blank');
    }
}

// Address formatter utilities
function formatAfroAddress(address) {
    if (!address) return '';
    if (address.startsWith('0x')) {
        return 'afro:' + address.slice(2);
    }
    return address;
}

function parseAfroAddress(address) {
    if (!address) return '';
    if (address.startsWith('afro:')) {
        return '0x' + address.slice(5);
    }
    return address;
}

// Network status checker
async function checkNetworkStatus() {
    try {
        const response = await fetch('/rpc', {
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
            console.log('Network is online. Latest block:', parseInt(data.result, 16));
            return true;
        }
    } catch (error) {
        console.error('Network check failed:', error);
    }
    return false;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Afro Network interface loaded');
    
    // Check network status
    checkNetworkStatus().then(isOnline => {
        if (isOnline) {
            console.log('Afro Network is online and ready!');
        } else {
            console.warn('Afro Network appears to be offline');
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Export utilities for use in other scripts
window.AfroUtils = {
    formatAddress: formatAfroAddress,
    parseAddress: parseAfroAddress,
    addToMetaMask: addToMetaMask,
    checkNetworkStatus: checkNetworkStatus
};
