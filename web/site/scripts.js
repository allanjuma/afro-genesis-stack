// MetaMask integration for Afro Network (both mainnet and testnet)
async function addToMetaMask(network = 'mainnet') {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const networkConfig = network === 'testnet' ? {
                chainId: '0x1ECF', // 7879 in hex
                chainName: 'Afro Testnet',
                nativeCurrency: {
                    name: 'Testnet Afro',
                    symbol: 'tAFRO',
                    decimals: 18
                },
                rpcUrls: ['http://localhost:8547'],
                blockExplorerUrls: ['http://localhost:4001']
            } : {
                chainId: '0x1ECE', // 7878 in hex
                chainName: 'Afro Network',
                nativeCurrency: {
                    name: 'Afro',
                    symbol: 'AFRO',
                    decimals: 18
                },
                rpcUrls: ['http://localhost:8545'],
                blockExplorerUrls: ['http://localhost:4000']
            };
            
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            });
            
            alert(`Afro ${network === 'testnet' ? 'Testnet' : 'Network'} has been added to MetaMask!`);
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

// Network tab switching
function showNetwork(network) {
    // Hide all network content
    document.querySelectorAll('.network-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected network content
    document.getElementById(`${network}-info`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// RPC tab switching
function showRPC(network) {
    // Hide all RPC content
    document.querySelectorAll('.rpc-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected RPC content
    document.getElementById(`${network}-rpc`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Export utilities for use in other scripts
window.AfroUtils = {
    formatAddress: formatAfroAddress,
    parseAddress: parseAfroAddress,
    addToMetaMask: addToMetaMask,
    checkNetworkStatus: checkNetworkStatus
};
