
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload,
  Wrench,
  GitPullRequest
} from "lucide-react";
import { StackStatus } from "@/services/ipcAPI";

interface RepositoryManagerProps {
  stackStatus: StackStatus;
  isOperating: boolean;
  onGitOperation: (operation: 'pull' | 'build') => void;
}

const RepositoryManager = ({ stackStatus, isOperating, onGitOperation }: RepositoryManagerProps) => {
  return (
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
            onClick={() => onGitOperation('pull')}
            disabled={isOperating || !stackStatus.connected}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isOperating ? 'Pulling...' : 'Pull Updates'}
          </Button>
          <Button 
            onClick={() => onGitOperation('build')}
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
  );
};

export default RepositoryManager;
