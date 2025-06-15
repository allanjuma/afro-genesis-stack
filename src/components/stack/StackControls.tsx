
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Activity,
  Server
} from "lucide-react";
import { StackStatus } from "@/services/ipcAPI";

interface StackControlsProps {
  stackStatus: StackStatus;
  isOperating: boolean;
  onStackOperation: (operation: 'start' | 'stop' | 'restart') => void;
  onRefreshStatus: () => void;
}

const StackControls = ({ 
  stackStatus, 
  isOperating, 
  onStackOperation, 
  onRefreshStatus 
}: StackControlsProps) => {
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500" : ""}>
        {isActive ? "Running" : "Stopped"}
      </Badge>
    );
  };

  return (
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
            onClick={() => onStackOperation('start')}
            disabled={isOperating || !stackStatus.connected}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isOperating ? 'Starting...' : 'Start Stack'}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => onStackOperation('stop')}
            disabled={isOperating || !stackStatus.connected}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            {isOperating ? 'Stopping...' : 'Stop Stack'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => onStackOperation('restart')}
            disabled={isOperating || !stackStatus.connected}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isOperating ? 'Restarting...' : 'Restart Stack'}
          </Button>
          <Button 
            variant="outline"
            onClick={onRefreshStatus}
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
  );
};

export default StackControls;
