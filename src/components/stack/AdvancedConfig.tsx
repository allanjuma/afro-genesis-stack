
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Activity } from "lucide-react";

const AdvancedConfig = () => {
  return (
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
  );
};

export default AdvancedConfig;
