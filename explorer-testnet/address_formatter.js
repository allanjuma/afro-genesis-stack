
// Custom address formatter for Afro testnet with mobile money integration
export function formatAddress(address) {
  if (!address) return '';
  
  // Handle new mobile money format: afro:254700000000:[extra_characters]
  if (address.startsWith('afro:254700000000:')) {
    return address; // Already in correct format
  }
  
  // Convert 0x addresses to afro: format for display
  if (address.startsWith('0x')) {
    // For backward compatibility, convert to basic afro: format
    // In production, this would generate the mobile money format with OTP validation
    return 'afro:' + address.slice(2);
  }
  
  // Handle basic afro: format
  if (address.startsWith('afro:') && !address.startsWith('afro:254700000000:')) {
    return address; // Keep as is for backward compatibility
  }
  
  return address;
}

export function parseAddress(address) {
  if (!address) return '';
  
  // Convert mobile money format back to 0x format for RPC calls
  if (address.startsWith('afro:254700000000:')) {
    // Extract the extra characters (protocol-compatible part)
    const extraChars = address.substring('afro:254700000000:'.length);
    // Convert to 0x format for blockchain compatibility
    return '0x' + extraChars;
  }
  
  // Convert basic afro: addresses back to 0x format for RPC calls
  if (address.startsWith('afro:')) {
    return '0x' + address.slice(5);
  }
  
  return address;
}

// Validate mobile money address format
export function validateMobileMoney(address) {
  if (!address) return false;
  
  // Check if address follows the mobile money format
  if (address.startsWith('afro:254700000000:')) {
    const extraChars = address.substring('afro:254700000000:'.length);
    // Extra characters should be hex-compatible for protocol compatibility
    return /^[a-fA-F0-9]+$/.test(extraChars) && extraChars.length >= 8;
  }
  
  return false;
}

// Generate OTP code from address extra characters
export function generateOTPFromAddress(address) {
  if (!validateMobileMoney(address)) return null;
  
  const extraChars = address.substring('afro:254700000000:'.length);
  // Use last 6 characters as OTP base
  const otpBase = extraChars.slice(-6);
  
  // Convert hex to numeric OTP (simple implementation)
  const otpNumber = parseInt(otpBase, 16) % 1000000;
  return otpNumber.toString().padStart(6, '0');
}

// Override default address display in the DOM
document.addEventListener('DOMContentLoaded', function() {
  const addressElements = document.querySelectorAll('[data-address]');
  addressElements.forEach(element => {
    const address = element.getAttribute('data-address');
    if (address) {
      const formattedAddress = formatAddress(address);
      element.textContent = formattedAddress;
      
      // Add mobile money indicator for new format addresses
      if (validateMobileMoney(formattedAddress)) {
        element.classList.add('mobile-money-address');
        element.title = 'Mobile Money Validated Address';
      }
    }
  });
});
