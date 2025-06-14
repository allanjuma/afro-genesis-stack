
import { useEffect } from 'react';

// This component sets up actual API communication with the validator docker container
const ValidatorAPI = () => {
  useEffect(() => {
    console.log('🔗 ValidatorAPI: Using actual validator endpoints');
    console.log('📡 Mainnet RPC: /rpc');
    console.log('🧪 Testnet RPC: /rpc-testnet');
    
    // No fetch interceptor - let requests go to actual validator endpoints
    // The nginx proxy will route /api/validator/* to the appropriate validator container
    
    return () => {
      console.log('ValidatorAPI cleanup');
    };
  }, []);
  
  return null;
};

export default ValidatorAPI;
