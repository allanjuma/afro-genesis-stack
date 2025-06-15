
import React, { useState, useEffect } from 'react';
import { ipcAPI, type StackStatus } from "@/services/ipcAPI";
import { toast } from "sonner";
import ConnectionStatus from "./stack/ConnectionStatus";
import OperationModeSelector, { operationModes } from "./stack/OperationModeSelector";
import StackControls from "./stack/StackControls";
import RepositoryManager from "./stack/RepositoryManager";
import AdvancedConfig from "./stack/AdvancedConfig";
import SystemInfo from "./stack/SystemInfo";

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

  // Load stack status on component mount and check IPC connection
  useEffect(() => {
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
        toast.error('IPC connection failed - running in demo mode');
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

  return (
    <div className="space-y-6">
      <ConnectionStatus 
        stackStatus={stackStatus}
        isOperating={isOperating}
        onCheckConnection={initializeConnection}
      />

      <OperationModeSelector 
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
      />

      <StackControls 
        stackStatus={stackStatus}
        isOperating={isOperating}
        onStackOperation={executeStackOperation}
        onRefreshStatus={loadStackStatus}
      />

      <RepositoryManager 
        stackStatus={stackStatus}
        isOperating={isOperating}
        onGitOperation={executeGitOperation}
      />

      <AdvancedConfig />

      <SystemInfo 
        stackStatus={stackStatus}
        selectedMode={selectedMode}
      />
    </div>
  );
};

export default StackManager;
