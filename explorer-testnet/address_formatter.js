
// Custom address formatter for Afro testnet
export function formatAddress(address) {
  if (!address) return '';
  
  // Convert 0x addresses to afro: format for display
  if (address.startsWith('0x')) {
    return 'afro:' + address.slice(2);
  }
  
  return address;
}

export function parseAddress(address) {
  if (!address) return '';
  
  // Convert afro: addresses back to 0x format for RPC calls
  if (address.startsWith('afro:')) {
    return '0x' + address.slice(5);
  }
  
  return address;
}

// Override default address display in the DOM
document.addEventListener('DOMContentLoaded', function() {
  const addressElements = document.querySelectorAll('[data-address]');
  addressElements.forEach(element => {
    const address = element.getAttribute('data-address');
    if (address && address.startsWith('0x')) {
      element.textContent = formatAddress(address);
    }
  });
});
