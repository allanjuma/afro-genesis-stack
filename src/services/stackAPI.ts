
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
}

class StackAPIService {
  private baseUrl = '';

  async executeStackOperation(operation: StackOperation): Promise<StackResponse> {
    try {
      // Since we're in an AppImage environment, we need to use the CEO service
      // which can execute Docker commands through the container network
      const response = await fetch('/api/ceo/stack-operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Stack ${operation.operation} completed successfully`);
      } else {
        toast.error(`Stack ${operation.operation} failed: ${result.message}`);
      }

      return result;
    } catch (error) {
      console.error(`Stack operation ${operation.operation} failed:`, error);
      toast.error(`Failed to ${operation.operation} stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeGitOperation(operation: GitOperation): Promise<StackResponse> {
    try {
      const response = await fetch('/api/ceo/git-operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Git ${operation.operation} completed successfully`);
      } else {
        toast.error(`Git ${operation.operation} failed: ${result.message}`);
      }

      return result;
    } catch (error) {
      console.error(`Git operation ${operation.operation} failed:`, error);
      toast.error(`Failed to ${operation.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getStackStatus(): Promise<any> {
    try {
      const response = await fetch('/api/ceo/stack-status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
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
}

export const stackAPI = new StackAPIService();
