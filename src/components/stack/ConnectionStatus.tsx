
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { StackStatus } from "@/services/ipcAPI";

interface ConnectionStatusProps {
  stackStatus: StackStatus;
  isOperating: boolean;
  onCheckConnection: () => void;
}

const ConnectionStatus = ({ stackStatus, isOperating, onCheckConnection }: ConnectionStatusProps) => {
  const getConnectionBadge = () => {
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
          onClick={onCheckConnection}
          disabled={isOperating}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          {isOperating ? 'Checking...' : 'Check Connection'}
        </Button>
        
        {!stackStatus.connected && (
          <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p>⚠️ IPC connection not available. Running in demo mode.</p>
            <p>To enable full functionality, ensure the Afro Network backend is running.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;
