
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ValidatorEndpoint {
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'checking';
}

// This component sets up actual API communication with the validator docker container
const ValidatorAPI = () => {
  const [endpoints, setEndpoints] = useState<ValidatorEndpoint[]>([
    { name: 'Mainnet RPC', url: '/rpc', status: 'checking' },
    { name: 'Testnet RPC', url: '/rpc-testnet', status: 'checking' }
  ]);

  useEffect(() => {
    console.log('🔗 ValidatorAPI: Initializing actual validator endpoints');
    
    // Check endpoint connectivity
    const checkEndpoints = async () => {
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
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
          
          setEndpoints(prev => prev.map(ep => 
            ep.name === endpoint.name 
              ? { ...ep, status: response.ok ? 'connected' : 'disconnected' }
              : ep
          ));
          
          if (response.ok) {
            console.log(`✅ ${endpoint.name} endpoint is responsive`);
          } else {
            console.warn(`⚠️ ${endpoint.name} endpoint returned error: ${response.status}`);
          }
        } catch (error) {
          console.warn(`❌ ${endpoint.name} endpoint is not reachable:`, error);
          setEndpoints(prev => prev.map(ep => 
            ep.name === endpoint.name 
              ? { ...ep, status: 'disconnected' }
              : ep
          ));
        }
      }
    };

    // Initial check
    checkEndpoints();
    
    // Set up periodic health checks every 30 seconds
    const healthCheckInterval = setInterval(checkEndpoints, 30000);
    
    // Set up request interceptor for better error handling
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      try {
        const response = await originalFetch(url, options);
        
        if (!response.ok && (url === '/rpc' || url === '/rpc-testnet')) {
          console.warn(`Validator endpoint error: ${response.status} for ${url}`);
        }
        
        return response;
      } catch (error) {
        if (url === '/rpc' || url === '/rpc-testnet') {
          console.error(`Validator endpoint failure for ${url}:`, error);
          toast.error(`Validator endpoint ${url} is not responding`);
        }
        throw error;
      }
    };
    
    return () => {
      clearInterval(healthCheckInterval);
      window.fetch = originalFetch;
      console.log('ValidatorAPI cleanup completed');
    };
  }, []);
  
  // Log current status
  useEffect(() => {
    const connectedCount = endpoints.filter(ep => ep.status === 'connected').length;
    const totalCount = endpoints.length;
    
    console.log(`📊 Validator API Status: ${connectedCount}/${totalCount} endpoints connected`);
    
    if (connectedCount === totalCount) {
      console.log('🎉 All validator endpoints are operational');
    } else if (connectedCount === 0) {
      console.warn('⚠️ No validator endpoints are responding');
    }
  }, [endpoints]);
  
  return null;
};

export default ValidatorAPI;
