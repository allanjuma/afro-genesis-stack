
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
  Wrench
} from "lucide-react";
import { stackAPI, type StackOperation, type GitOperation } from "@/services/stackAPI";
import { toast } from "sonner";

interface StackStatus {
  mainnet: boolean;
  testnet: boolean;
  explorer: boolean;
  website: boolean;
  ceo: boolean;
}

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
    ceo: false
  });
  
  const [selectedMode, setSelectedMode] = useState<string>('production');
  const [isOperating, setIsOperating] = useState(false);

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

  // Load stack status on component mount
  useEffect(() => {
    loadStackStatus();
  }, []);

  const loadStackStatus = async () => {
    try {
      const status = await stackAPI.getStackStatus();
      setStackStatus(status);
    } catch (error) {
      console.error('Failed to load stack status:', error);
      toast.error('Failed to load stack status');
    }
  };

  const executeStackOperation = async (operation: 'start' | 'stop' | 'restart', mode?: string) => {
    setIsOperating(true);
    
    try {
      const operationMode = mode || selectedMode;
      const services = operationModes.find(m => m.id === operationMode)?.services || [];
      
      const stackOperation: StackOperation = {
        operation,
        mode: operationMode,
        services
      };

      const result = await stackAPI.executeStackOperation(stackOperation);
      
      if (result.success) {
        // Update stack status based on operation
        if (operation === 'start') {
          const mode = operationModes.find(m => m.id === selectedMode);
          if (mode) {
            setStackStatus({
              mainnet: mode.services.includes('afro-validator'),
              testnet: mode.services.includes('afro-testnet-validator'),
              explorer: mode.services.includes('afro-explorer') || mode.services.includes('afro-testnet-explorer'),
              website: mode.services.includes('afro-web'),
              ceo: mode.services.includes('ceo')
            });
          }
        } else if (operation === 'stop') {
          setStackStatus({
            mainnet: false,
            testnet: false,
            explorer: false,
            website: false,
            ceo: false
          });
        }
        
        // Reload status after a delay
        setTimeout(loadStackStatus, 2000);
      }
      
    } catch (error) {
      console.error(`Stack operation ${operation} failed:`, error);
      toast.error(`Stack operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const executeGitOperation = async (operation: 'clone' | 'pull' | 'build') => {
    setIsOperating(true);
    
    try {
      const gitOperation: GitOperation = { operation };
      const result = await stackAPI.executeGitOperation(gitOperation);
      
      if (result.success) {
        console.log(`Git operation ${operation} completed successfully`);
      }
      
    } catch (error) {
      console.error(`Git operation ${operation} failed:`, error);
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

  return (
    <div className="space-y-6">
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
            Start, stop, and restart the Afro Network stack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => executeStackOperation('start')}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isOperating ? 'Starting...' : 'Start Stack'}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => executeStackOperation('stop')}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {isOperating ? 'Stopping...' : 'Stop Stack'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => executeStackOperation('restart')}
              disabled={isOperating}
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
            Clone, update, and build the Afro Network codebase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => executeGitOperation('clone')}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isOperating ? 'Cloning...' : 'Clone Repository'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => executeGitOperation('pull')}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isOperating ? 'Pulling...' : 'Pull Updates'}
            </Button>
            <Button 
              onClick={() => executeGitOperation('build')}
              disabled={isOperating}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              {isOperating ? 'Building...' : 'Build Containers'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Clone: Download the latest Afro Network source code</p>
            <p>• Pull: Update existing repository with latest changes</p>
            <p>• Build: Compile and create Docker containers from source</p>
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
