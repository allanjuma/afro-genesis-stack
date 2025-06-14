
import { useEffect } from 'react';

// This component sets up mock API endpoints for validator communication
const ValidatorAPI = () => {
  useEffect(() => {
    // Mock API server for validator communication
    const originalFetch = window.fetch;
    
    window.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlString = url.toString();
      
      if (urlString.includes('/api/validator/generate-address')) {
        // Simulate address generation call
        console.log('🚀 Starting address generation for MSISDN: 254000000000');
        console.log('📍 Target prefix: afro:254000000000:');
        console.log('⚡ Validator will earn 10 AFRO upon successful generation');
        
        // Simulate calling the validator script
        setTimeout(() => {
          console.log('🔄 Address generation in progress...');
          console.log('🎯 Brute-force search started for valid address');
        }, 1000);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Address generation started',
          msisdn: '254000000000',
          targetPrefix: 'afro:254000000000:'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (urlString.includes('/api/validator/address-stats')) {
        // Return current stats including any new generations
        return new Response(JSON.stringify({
          totalGenerated: 1248,
          pendingGenerations: 4,
          avgAttempts: 125000,
          recentGenerations: [
            {
              id: '0',
              msisdn: '254000000000',
              status: 'pending',
              attempts: 25000,
              timestamp: new Date(),
              validationSent: false
            },
            {
              id: '1',
              msisdn: '254700000001',
              status: 'completed',
              attempts: 89234,
              timestamp: new Date(Date.now() - 300000),
              address: 'afro:254700000001:a1b2c3d4e5f67890abcdef1234567890',
              validationSent: true
            },
            {
              id: '2',
              msisdn: '254700000002',
              status: 'pending',
              attempts: 45000,
              timestamp: new Date(Date.now() - 120000),
              validationSent: false
            },
            {
              id: '3',
              msisdn: '254700000003',
              status: 'completed',
              attempts: 156789,
              timestamp: new Date(Date.now() - 600000),
              address: 'afro:254700000003:f9e8d7c6b5a4938271605f4e3d2c1b0a',
              validationSent: true
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Fall back to original fetch for other requests
      return originalFetch(url, init);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return null;
};

export default ValidatorAPI;
