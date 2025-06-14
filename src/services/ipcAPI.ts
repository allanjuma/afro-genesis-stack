
import { toast } from "sonner";

export interface IPCResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface StackStatus {
  mainnet: boolean;
  testnet: boolean;
  explorer: boolean;
  website: boolean;
  ceo: boolean;
  connected: boolean;
}

class IPCAPIService {
  private isConnected = false;
  private baseUrl = '';

  async checkConnection(): Promise<boolean> {
    try {
      console.log('Checking IPC connection...');
      
      // Try to reach the CEO API service which should be available
      const response = await fetch('/api/ceo/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.isConnected = true;
        console.log('IPC connection established via CEO API');
        return true;
      }
      
      throw new Error(`Health check failed: ${response.status}`);
    } catch (error) {
      console.log('IPC connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async executeDockerCommand(command: string): Promise<IPCResponse> {
    try {
      console.log(`Executing Docker command via IPC: ${command}`);
      
      if (!this.isConnected) {
        await this.checkConnection();
      }

      if (!this.isConnected) {
        throw new Error('IPC connection not available');
      }

      const response = await fetch('/api/ceo/docker-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: result.success || false,
        message: result.message || 'Command executed',
        data: result.output || result.data,
        error: result.error
      };
    } catch (error) {
      console.error('Docker command execution failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getStackStatus(): Promise<StackStatus> {
    try {
      console.log('Getting stack status via IPC...');
      
      const result = await this.executeDockerCommand('docker ps --format "{{.Names}}\t{{.Status}}" --filter "name=afro"');
      
      if (!result.success) {
        console.log('Docker ps command failed, checking individual containers...');
        
        // Fallback: try to check individual containers
        const containers = ['afro-validator', 'afro-testnet-validator', 'afro-explorer', 'afro-testnet-explorer', 'afro-web', 'afro-ceo'];
        const statuses = await Promise.all(
          containers.map(async (container) => {
            const cmd = `docker ps --format "{{.Names}}\t{{.Status}}" --filter "name=${container}"`;
            const res = await this.executeDockerCommand(cmd);
            return { container, running: res.success && res.data && res.data.includes('Up') };
          })
        );
        
        return {
          mainnet: statuses.find(s => s.container === 'afro-validator')?.running || false,
          testnet: statuses.find(s => s.container === 'afro-testnet-validator')?.running || false,
          explorer: statuses.some(s => (s.container.includes('explorer')) && s.running),
          website: statuses.find(s => s.container === 'afro-web')?.running || false,
          ceo: statuses.find(s => s.container === 'afro-ceo')?.running || false,
          connected: this.isConnected
        };
      }

      const output = result.data || '';
      const containerLines = output.split('\n').filter((line: string) => line.trim() && !line.includes('NAMES'));
      
      return {
        mainnet: containerLines.some((line: string) => line.includes('afro-validator') && line.includes('Up')),
        testnet: containerLines.some((line: string) => line.includes('afro-testnet-validator') && line.includes('Up')),
        explorer: containerLines.some((line: string) => (line.includes('afro-explorer') || line.includes('afro-testnet-explorer')) && line.includes('Up')),
        website: containerLines.some((line: string) => line.includes('afro-web') && line.includes('Up')),
        ceo: containerLines.some((line: string) => line.includes('afro-ceo') && line.includes('Up')),
        connected: this.isConnected
      };
    } catch (error) {
      console.error('Failed to get stack status:', error);
      return {
        mainnet: false,
        testnet: false,
        explorer: false,
        website: false,
        ceo: false,
        connected: false
      };
    }
  }

  async startStack(services?: string[]): Promise<IPCResponse> {
    const serviceList = services && services.length > 0 ? services.join(' ') : '';
    const command = `docker-compose up -d ${serviceList}`.trim();
    
    const result = await this.executeDockerCommand(command);
    
    if (result.success) {
      toast.success('Stack started successfully');
    } else {
      toast.error(`Failed to start stack: ${result.message}`);
    }
    
    return result;
  }

  async stopStack(services?: string[]): Promise<IPCResponse> {
    const command = services && services.length > 0 
      ? `docker-compose stop ${services.join(' ')}`
      : 'docker-compose down';
    
    const result = await this.executeDockerCommand(command);
    
    if (result.success) {
      toast.success('Stack stopped successfully');
    } else {
      toast.error(`Failed to stop stack: ${result.message}`);
    }
    
    return result;
  }

  async restartStack(services?: string[]): Promise<IPCResponse> {
    const serviceList = services && services.length > 0 ? services.join(' ') : '';
    const command = `docker-compose restart ${serviceList}`.trim();
    
    const result = await this.executeDockerCommand(command);
    
    if (result.success) {
      toast.success('Stack restarted successfully');
    } else {
      toast.error(`Failed to restart stack: ${result.message}`);
    }
    
    return result;
  }

  async pullUpdates(): Promise<IPCResponse> {
    const result = await this.executeDockerCommand('git pull origin main');
    
    if (result.success) {
      toast.success('Updates pulled successfully');
    } else {
      toast.error(`Failed to pull updates: ${result.message}`);
    }
    
    return result;
  }

  async buildContainers(): Promise<IPCResponse> {
    const result = await this.executeDockerCommand('docker-compose build --no-cache');
    
    if (result.success) {
      toast.success('Containers built successfully');
    } else {
      toast.error(`Failed to build containers: ${result.message}`);
    }
    
    return result;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const ipcAPI = new IPCAPIService();
