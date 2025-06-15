import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Upload,
  Server,
  Globe,
  Activity,
  GitPullRequest,
  Wrench,
  Wifi,
  WifiOff
} from "lucide-react";
import { ipcAPI, type StackStatus } from "@/services/ipcAPI";
import { toast } from "sonner";

interface OperationMode {
  id: string;
  name: string;
  description: string;
  services: string[];
}

const StackManager = () => {
  const [stackStatus, setStackStatus] = useState<StackStatus>({
    mainnet: false,
    testnet: false,
    explorer: false,
    website: false,
    ceo: false,
    connected: false
  });
  
  const [selectedMode, setSelectedMode] = useState<string>('production');
  const [isOperating, setIsOperating] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  const operationModes: OperationMode[] = [
    {
      id: 'production',
      name: 'Production',
      description: 'Full mainnet with explorer and website',
      services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-web', 'ceo']
    },
    {
      id: 'testnet',
      name: 'Testnet Only',
      description: 'Testnet validator with explorer for development',
      services: ['afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer']
    },
    {
      id: 'dual',
      name: 'Dual Network',
      description: 'Both mainnet and testnet running simultaneously',
      services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer']
    },
    {
      id: 'website',
      name: 'Website Only',
      description: 'Static website without blockchain services',
      services: ['afro-web']
    },
    {
      id: 'development',
      name: 'Development',
      description: 'All services for local development',
      services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer', 'afro-web', 'ceo']
    }
  ];

  // Load stack status on component mount and check IPC connection
  useEffect(() => {
    setIsDevelopmentMode(ipcAPI.isDevelopment());
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    try {
      const connected = await ipcAPI.checkConnection();
      console.log('IPC connection status:', connected);
      
      if (connected) {
        await loadStackStatus();
      } else {
        setStackStatus(prev => ({ ...prev, connected: false }));
        if (!isDevelopmentMode) {
          toast.error('IPC connection failed - running in demo mode');
        }
      }
    } catch (error) {
      console.error('Failed to initialize IPC connection:', error);
      setStackStatus(prev => ({ ...prev, connected: false }));
    }
  };

  const loadStackStatus = async () => {
    try {
      console.log('Loading stack status via IPC...');
      const status = await ipcAPI.getStackStatus();
      setStackStatus(status);
      console.log('Stack status loaded:', status);
    } catch (error) {
      console.error('Failed to load stack status:', error);
      toast.error('Failed to load stack status');
      setStackStatus(prev => ({ ...prev, connected: false }));
    }
  };

  const executeStackOperation = async (operation: 'start' | 'stop' | 'restart') => {
    if (!stackStatus.connected) {
      toast.error('IPC not connected - cannot execute operation');
      return;
    }

    setIsOperating(true);
    
    try {
      const mode = operationModes.find(m => m.id === selectedMode);
      const services = mode?.services || [];
      
      console.log(`Executing ${operation} operation with services:`, services);
      
      let result;
      switch (operation) {
        case 'start':
          result = await ipcAPI.startStack(services);
          break;
        case 'stop':
          result = await ipcAPI.stopStack(services);
          break;
        case 'restart':
          result = await ipcAPI.restartStack(services);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.success) {
        console.log(`${operation} operation completed successfully`);
        // Reload status after a delay
        setTimeout(loadStackStatus, 3000);
      } else {
        console.error(`${operation} operation failed:`, result.message);
      }
      
    } catch (error) {
      console.error(`Stack operation ${operation} failed:`, error);
      toast.error(`Stack operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const executeGitOperation = async (operation: 'pull' | 'build') => {
    if (!stackStatus.connected) {
      toast.error('IPC not connected - cannot execute operation');
      return;
    }

    setIsOperating(true);
    
    try {
      console.log(`Executing git operation: ${operation}`);
      
      let result;
      switch (operation) {
        case 'pull':
          result = await ipcAPI.pullUpdates();
          break;
        case 'build':
          result = await ipcAPI.buildContainers();
          break;
        default:
          throw new Error(`Unknown git operation: ${operation}`);
      }

      if (result.success) {
        console.log(`Git operation ${operation} completed successfully`);
      } else {
        console.error(`Git operation ${operation} failed:`, result.message);
      }
      
    } catch (error) {
      console.error(`Git operation ${operation} failed:`, error);
      toast.error(`Git operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500" : ""}>
        {isActive ? "Running" : "Stopped"}
      </Badge>
    );
  };

  const getConnectionBadge = () => {
    if (isDevelopmentMode) {
      return (
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-orange-500" />
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">Development Mode</Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {stackStatus.connected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-500">Connected</Badge>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <Badge variant="destructive">Disconnected</Badge>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* IPC Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            IPC Connection Status
          </CardTitle>
          <CardDescription>
            Inter-Process Communication status for Docker container management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection Status</span>
            {getConnectionBadge()}
          </div>
          
          <Button 
            variant="outline"
            onClick={initializeConnection}
            disabled={isOperating}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isOperating ? 'Checking...' : 'Check Connection'}
          </Button>
          
          {isDevelopmentMode ? (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p>🚧 <strong>Development Mode Active</strong></p>
              <p>This is a preview environment. IPC features are simulated and Docker operations are disabled.</p>
              <p>Deploy the full Afro Network stack to enable all functionality.</p>
            </div>
          ) : !stackStatus.connected && (
            <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <p>⚠️ IPC connection not available. Running in demo mode.</p>
              <p>To enable full functionality, ensure the Afro Network backend is running.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Operation Mode
          </CardTitle>
          <CardDescription>
            Select the configuration mode for your Afro Network stack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup type="single" value={selectedMode} onValueChange={setSelectedMode}>
            {operationModes.map((mode) => (
              <ToggleGroupItem key={mode.id} value={mode.id} className="flex-col h-auto p-4">
                <div className="font-medium">{mode.name}</div>
                <div className="text-xs text-muted-foreground text-center">{mode.description}</div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          
          <div className="text-sm text-muted-foreground">
            <strong>Selected services:</strong> {operationModes.find(m => m.id === selectedMode)?.services.join(', ')}
          </div>
        </CardContent>
      </Card>

      {/* Stack Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Stack Control
          </CardTitle>
          <CardDescription>
            Start, stop, and restart the Afro Network stack via IPC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => executeStackOperation('start')}
              disabled={isOperating || !stackStatus.connected}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isOperating ? 'Starting...' : 'Start Stack'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => executeStackOperation('stop')}
              disabled={isOperating || !stackStatus.connected}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {isOperating ? 'Stopping...' : 'Stop Stack'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => executeStackOperation('restart')}
              disabled={isOperating || !stackStatus.connected}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {isOperating ? 'Restarting...' : 'Restart Stack'}
            </Button>
            <Button 
              variant="outline"
              onClick={loadStackStatus}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
          
          <Separator />
          
          {/* Service Status */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Mainnet</span>
              {getStatusBadge(stackStatus.mainnet)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Testnet</span>
              {getStatusBadge(stackStatus.testnet)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Explorer</span>
              {getStatusBadge(stackStatus.explorer)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Website</span>
              {getStatusBadge(stackStatus.website)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">CEO Agent</span>
              {getStatusBadge(stackStatus.ceo)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Repository Management
          </CardTitle>
          <CardDescription>
            Update and build the Afro Network codebase via IPC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => executeGitOperation('pull')}
              disabled={isOperating || !stackStatus.connected}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isOperating ? 'Pulling...' : 'Pull Updates'}
            </Button>
            <Button 
              onClick={() => executeGitOperation('build')}
              disabled={isOperating || !stackStatus.connected}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              {isOperating ? 'Building...' : 'Build Containers'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Pull: Update existing repository with latest changes</p>
            <p>• Build: Compile and create Docker containers from source</p>
            {!stackStatus.connected && <p>• IPC connection required for operations</p>}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Advanced Configuration
          </CardTitle>
          <CardDescription>
            Fine-tune stack behavior and enable advanced features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Development Mode</div>
                <div className="text-sm text-muted-foreground">Enable verbose logging and debugging</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-restart</div>
                <div className="text-sm text-muted-foreground">Automatically restart failed services</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Backup Mode</div>
                <div className="text-sm text-muted-foreground">Create periodic data backups</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Monitoring</div>
                <div className="text-sm text-muted-foreground">Enable detailed performance monitoring</div>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system status and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• AppImage Environment: Active</p>
            <p>• Docker Engine: Available</p>
            <p>• IPC Layer: Connected</p>
            <p>• Stack Configuration: {operationModes.find(m => m.id === selectedMode)?.name}</p>
            <p>• Active Services: {Object.values(stackStatus).filter(Boolean).length}/5</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StackManager;
