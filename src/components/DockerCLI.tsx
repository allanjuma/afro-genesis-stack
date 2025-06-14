
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Terminal, Play, Square, RotateCcw, Trash2, FileText, Activity } from "lucide-react";

interface CommandOutput {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'running' | 'success' | 'error';
  exitCode?: number;
}

const DockerCLI = () => {
  const [command, setCommand] = useState('');
  const [outputs, setOutputs] = useState<CommandOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Predefined Docker commands for quick access
  const quickCommands = [
    { label: 'List Containers', command: 'docker ps -a' },
    { label: 'Stack Status', command: 'docker-compose ps' },
    { label: 'Start Stack', command: 'docker-compose up -d' },
    { label: 'Stop Stack', command: 'docker-compose down' },
    { label: 'Restart Stack', command: 'docker-compose restart' },
    { label: 'View Logs', command: 'docker-compose logs --tail=50' },
    { label: 'Pull Updates', command: 'docker-compose pull' },
    { label: 'System Info', command: 'docker system info' },
  ];

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [outputs]);

  // Execute Docker command via IPC (AppImage environment)
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    const commandId = `cmd_${Date.now()}`;
    const newOutput: CommandOutput = {
      id: commandId,
      command: cmd,
      output: '',
      timestamp: new Date(),
      status: 'running'
    };

    setOutputs(prev => [...prev, newOutput]);
    setIsExecuting(true);

    try {
      // In an AppImage environment, we would use IPC to communicate with the main process
      // For now, we'll simulate the API call that would handle Docker commands
      const response = await fetch('/api/docker-cli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setOutputs(prev => prev.map(output => 
        output.id === commandId 
          ? {
              ...output,
              output: result.output,
              status: result.exitCode === 0 ? 'success' : 'error',
              exitCode: result.exitCode
            }
          : output
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setOutputs(prev => prev.map(output => 
        output.id === commandId 
          ? {
              ...output,
              output: `Error: ${errorMessage}\n\nNote: This requires the AppImage IPC layer to execute Docker commands. Make sure you're running the AppImage version on Linux with Docker installed.`,
              status: 'error',
              exitCode: 1
            }
          : output
      ));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
    setCommand('');
  };

  const clearOutput = () => {
    setOutputs([]);
  };

  const getStatusBadge = (status: CommandOutput['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="animate-pulse">Running</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Docker CLI Control
          </CardTitle>
          <CardDescription>
            Execute Docker commands to control the Afro Network stack (requires AppImage environment)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Commands */}
          <div>
            <h4 className="text-sm font-medium mb-2">Quick Commands</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickCommands.map((qCmd) => (
                <Button
                  key={qCmd.command}
                  variant="outline"
                  size="sm"
                  onClick={() => executeCommand(qCmd.command)}
                  disabled={isExecuting}
                  className="text-xs"
                >
                  {qCmd.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Command Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Enter Docker command (e.g., docker ps, docker-compose logs)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isExecuting}
              className="font-mono"
            />
            <Button type="submit" disabled={isExecuting || !command.trim()}>
              <Play className="h-4 w-4" />
            </Button>
          </form>

          {/* Command Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Command Output</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearOutput}
                disabled={outputs.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            
            <ScrollArea className="h-96 w-full rounded-md border p-4 bg-black text-green-400 font-mono text-sm">
              <div ref={scrollAreaRef} className="space-y-4">
                {outputs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    No commands executed yet. Use the quick commands or type a Docker command above.
                  </div>
                ) : (
                  outputs.map((output) => (
                    <div key={output.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">$</span>
                          <span className="text-white">{output.command}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(output.status)}
                          <span className="text-xs text-muted-foreground">
                            {output.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap text-green-400 pl-4 border-l-2 border-green-600">
                        {output.output || (output.status === 'running' ? 'Executing...' : '')}
                      </pre>
                      {output.exitCode !== undefined && (
                        <div className="text-xs text-muted-foreground pl-4">
                          Exit code: {output.exitCode}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Docker Stack Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Docker Stack Status
          </CardTitle>
          <CardDescription>
            Real-time status of Afro Network Docker containers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>• Use "Stack Status" to check container health</p>
            <p>• Use "Start Stack" to initialize all services</p>
            <p>• Use "View Logs" to monitor service output</p>
            <p>• Use "Stop Stack" to gracefully shutdown services</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DockerCLI;
