
import { toast } from "sonner";

export interface StackOperation {
  operation: 'start' | 'stop' | 'restart';
  mode: string;
  services: string[];
}

export interface GitOperation {
  operation: 'clone' | 'pull' | 'build';
}

export interface StackResponse {
  success: boolean;
  message: string;
  services?: string[];
  logs?: string[];
  output?: string;
}

export interface EndpointConfig {
  service: string;
  defaultEndpoint: string;
  customEndpoint?: string;
  port: string;
  description?: string;
  category: 'validator' | 'explorer' | 'database' | 'ai' | 'web';
}

class StackAPIService {
  private baseUrl = '';
  private maxRetries = 3;
  private retryDelay = 1000;

  private async makeRequest(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok && retries < this.maxRetries) {
        console.warn(`Request failed (${response.status}), retrying... (${retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.makeRequest(url, options, retries + 1);
      }

      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`Request error, retrying... (${retries + 1}/${this.maxRetries})`, error);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  async executeStackOperation(operation: StackOperation): Promise<StackResponse> {
    try {
      console.log(`Executing stack operation: ${operation.operation} with services:`, operation.services);
      
      const response = await this.makeRequest('/api/ceo/stack-operation', {
        method: 'POST',
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Stack ${operation.operation} completed successfully`);
        if (result.logs && result.logs.length > 0) {
          console.log('Operation logs:', result.logs);
        }
      } else {
        toast.error(`Stack ${operation.operation} failed: ${result.message}`);
        console.error('Operation failed:', result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Stack operation ${operation.operation} failed:`, error);
      toast.error(`Failed to ${operation.operation} stack: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async executeGitOperation(operation: GitOperation): Promise<StackResponse> {
    try {
      console.log(`Executing git operation: ${operation.operation}`);
      
      const response = await this.makeRequest('/api/ceo/git-operation', {
        method: 'POST',
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Git ${operation.operation} completed successfully`);
        if (result.logs && result.logs.length > 0) {
          console.log('Git operation logs:', result.logs);
        }
      } else {
        toast.error(`Git ${operation.operation} failed: ${result.message}`);
        console.error('Git operation failed:', result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Git operation ${operation.operation} failed:`, error);
      toast.error(`Failed to ${operation.operation}: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async getStackStatus(): Promise<any> {
    try {
      console.log('Fetching stack status...');
      
      const response = await this.makeRequest('/api/ceo/stack-status', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.json();
      console.log('Stack status:', status);
      return status;
    } catch (error) {
      console.error('Failed to get stack status:', error);
      return {
        mainnet: false,
        testnet: false,
        explorer: false,
        website: false,
        ceo: false
      };
    }
  }

  /**
   * Save endpoint configuration and restart relevant containers/services.
   * Assumes backend endpoint exists at /api/ceo/set-endpoints
   */
  async saveEndpointConfig(endpoints: EndpointConfig[]): Promise<{ success: boolean; restarted?: string[]; message?: string }> {
    try {
      const response = await this.makeRequest('/api/ceo/set-endpoints', {
        method: 'POST',
        body: JSON.stringify({ endpoints }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status} ${response.statusText}`);
      }

      const resp = await response.json();
      if (resp.success) {
        toast.success("Settings saved to containers.");
      } else {
        toast.error("Failed to save settings: " + (resp.message || 'Unknown error'));
      }
      return resp;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Saving settings failed: " + msg);
      return { success: false, message: msg };
    }
  }

  /**
   * Health check method to verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/health', {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
}

export const stackAPI = new StackAPIService();
