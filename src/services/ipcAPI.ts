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
  private connectionRetries = 0;
  private maxRetries = 3;
  private retryDelay = 2000;
  private isDevelopmentMode = false;

  constructor() {
    // Detect if we're in development/preview mode
    this.isDevelopmentMode = window.location.hostname.includes('lovable.app') || 
                            window.location.hostname === 'localhost' ||
                            window.location.port !== '';
    
    if (this.isDevelopmentMode) {
      console.log('🚧 Running in development mode - IPC features will be simulated');
    }
  }

  async checkConnection(): Promise<boolean> {
    if (this.isDevelopmentMode) {
      console.log('🚧 Development mode detected - simulating IPC connection');
      this.isConnected = false; // Keep as disconnected but don't show errors
      return false;
    }

    try {
      console.log('Checking IPC connection...');
      
      const response = await fetch('/api/ceo/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      // Check if response is actually JSON and not HTML
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend service not available (received HTML instead of JSON)');
      }
      
      if (response.ok) {
        const data = await response.json();
        this.isConnected = true;
        this.connectionRetries = 0;
        console.log('IPC connection established:', data);
        return true;
      }
      
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log('IPC connection check failed:', error);
      this.isConnected = false;
      
      // Don't retry in development mode or if it's clearly a development issue
      if (this.isDevelopmentMode || error instanceof TypeError) {
        return false;
      }
      
      // Retry logic for production environments
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.checkConnection();
      }
      
      return false;
    }
  }

  async executeDockerCommand(command: string): Promise<IPCResponse> {
    if (this.isDevelopmentMode) {
      console.log(`🚧 Development mode: would execute Docker command: ${command}`);
      return {
        success: false,
        message: 'Docker commands not available in development mode',
        error: 'Development environment - Docker operations disabled'
      };
    }

    try {
      console.log(`Executing Docker command via IPC: ${command}`);
      
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          throw new Error('IPC connection not available');
        }
      }

      const response = await fetch('/api/ceo/docker-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for docker commands
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
      
      // Reset connection status on failure
      if (error instanceof Error && error.message.includes('fetch')) {
        this.isConnected = false;
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getStackStatus(): Promise<StackStatus> {
    if (this.isDevelopmentMode) {
      console.log('🚧 Development mode: returning simulated stack status');
      return {
        mainnet: false,
        testnet: false,
        explorer: false,
        website: false,
        ceo: false,
        connected: false
      };
    }

    try {
      console.log('Getting stack status via IPC...');
      
      // First check if we can reach the CEO backend
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          return this.getDefaultStackStatus();
        }
      }

      // Try to get status from CEO backend first
      const response = await fetch('/api/ceo/stack-status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const status = await response.json();
        return {
          ...status,
          connected: true
        };
      }

      // Fallback to docker ps command
      const result = await this.executeDockerCommand('docker ps --format "{{.Names}}\t{{.Status}}" --filter "name=afro"');
      
      if (!result.success) {
        console.log('Docker ps command failed, checking individual containers...');
        return await this.checkIndividualContainers();
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
      this.isConnected = false;
      return this.getDefaultStackStatus();
    }
  }

  private async checkIndividualContainers(): Promise<StackStatus> {
    const containers = ['afro-validator', 'afro-testnet-validator', 'afro-explorer', 'afro-testnet-explorer', 'afro-web', 'afro-ceo'];
    const statuses = await Promise.all(
      containers.map(async (container) => {
        try {
          const cmd = `docker ps --format "{{.Names}}\t{{.Status}}" --filter "name=${container}"`;
          const res = await this.executeDockerCommand(cmd);
          return { container, running: res.success && res.data && res.data.includes('Up') };
        } catch {
          return { container, running: false };
        }
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

  private getDefaultStackStatus(): StackStatus {
    return {
      mainnet: false,
      testnet: false,
      explorer: false,
      website: false,
      ceo: false,
      connected: false
    };
  }

  async startStack(services?: string[]): Promise<IPCResponse> {
    if (this.isDevelopmentMode) {
      toast.info('Development mode: Stack operations are simulated');
      return { 
        success: false, 
        message: 'Stack operations not available in development mode',
        error: 'Development environment'
      };
    }

    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        toast.error('IPC connection not available');
        return { success: false, message: 'IPC connection not available' };
      }
    }

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
    if (this.isDevelopmentMode) {
      toast.info('Development mode: Stack operations are simulated');
      return { 
        success: false, 
        message: 'Stack operations not available in development mode',
        error: 'Development environment'
      };
    }

    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        toast.error('IPC connection not available');
        return { success: false, message: 'IPC connection not available' };
      }
    }

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
    if (this.isDevelopmentMode) {
      toast.info('Development mode: Stack operations are simulated');
      return { 
        success: false, 
        message: 'Stack operations not available in development mode',
        error: 'Development environment'
      };
    }

    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        toast.error('IPC connection not available');
        return { success: false, message: 'IPC connection not available' };
      }
    }

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
    if (this.isDevelopmentMode) {
      toast.info('Development mode: Git operations are simulated');
      return { 
        success: false, 
        message: 'Git operations not available in development mode',
        error: 'Development environment'
      };
    }

    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        toast.error('IPC connection not available');
        return { success: false, message: 'IPC connection not available' };
      }
    }

    const result = await this.executeDockerCommand('git pull origin main');
    
    if (result.success) {
      toast.success('Updates pulled successfully');
    } else {
      toast.error(`Failed to pull updates: ${result.message}`);
    }
    
    return result;
  }

  async buildContainers(): Promise<IPCResponse> {
    if (this.isDevelopmentMode) {
      toast.info('Development mode: Container builds are simulated');
      return { 
        success: false, 
        message: 'Container builds not available in development mode',
        error: 'Development environment'
      };
    }

    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        toast.error('IPC connection not available');
        return { success: false, message: 'IPC connection not available' };
      }
    }

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

  // Add method to manually reset connection
  resetConnection(): void {
    this.isConnected = false;
    this.connectionRetries = 0;
  }

  // Check if running in development mode
  isDevelopment(): boolean {
    return this.isDevelopmentMode;
  }
}

export const ipcAPI = new IPCAPIService();
