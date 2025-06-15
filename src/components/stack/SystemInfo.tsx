
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { StackStatus } from "@/services/ipcAPI";
import { operationModes } from "./OperationModeSelector";

interface SystemInfoProps {
  stackStatus: StackStatus;
  selectedMode: string;
}

const SystemInfo = ({ stackStatus, selectedMode }: SystemInfoProps) => {
  return (
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
  );
};

export default SystemInfo;
