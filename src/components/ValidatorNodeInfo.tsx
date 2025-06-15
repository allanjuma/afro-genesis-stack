import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Wifi, Settings, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ValidatorEditableSettings from "./ValidatorEditableSettings";

interface NodeInfo {
  nodeId: string;
  version: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: string;
  networkOut: string;
  validatorPhone: string;
  smsApiStatus: string;
  pendingAddresses: number;
}

const ValidatorNodeInfo = () => {
  const { data: nodeInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['validatorNodeInfo'],
    queryFn: async (): Promise<NodeInfo> => {
      const response = await fetch('/rpc', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "afro_getNodeInfo",
          params: [],
          id: 88
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'RPC error');
      }
      
      return data.result;
    },
    refetchInterval: 5000,
    retry: false
  });

  // Add query to fetch the enode URL
  const { data: enodeUrl } = useQuery({
    queryKey: ['enodeUrl'],
    queryFn: async () => {
      const res = await fetch('/api/validator/enode_url.txt', { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch enode URL");
      const txt = await res.text();
      // Clean up whitespace/newlines.
      return txt.trim();
    },
    refetchInterval: 30000, // re-poll every 30s in case node restarted
    retry: false,
  });

  // Save endpoint for validator settings
  async function handleSaveSettings(updated: { nodeId: string; validatorPhone: string }) {
    const response = await fetch('/rpc', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "afro_updateNodeSettings",
        params: [updated],
        id: 99
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await refetch();
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading validator info...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Validator Node Offline
            </CardTitle>
            <CardDescription className="text-red-500">
              Unable to connect to validator service: {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">
              The validator node is not responding. Please ensure the validator service is running.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUsageColor = (usage: number) => {
    if (usage > 80) return "text-red-500";
    if (usage > 60) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Validator Node Status
          </CardTitle>
          <CardDescription>Real-time node performance and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New: Display enode URL for sharing */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-sm font-semibold">Enode URL:</span>
              {enodeUrl ? (
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all select-all">{enodeUrl}</span>
              ) : (
                <span className="text-xs text-gray-400 italic">Loading...</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Share this enode URL with peers to let them connect to your validator node.
            </div>
          </div>
          {/* ... keep rest of node stats UI ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatorEditableSettings
              settings={{
                nodeId: nodeInfo?.nodeId || "",
                validatorPhone: nodeInfo?.validatorPhone || ""
              }}
              onSave={handleSaveSettings}
            />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  CPU Usage:
                </span>
                <span className={`text-sm font-bold ${getUsageColor(nodeInfo?.cpuUsage || 0)}`}>
                  {nodeInfo?.cpuUsage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Memory:
                </span>
                <span className={`text-sm font-bold ${getUsageColor(nodeInfo?.memoryUsage || 0)}`}>
                  {nodeInfo?.memoryUsage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Disk:
                </span>
                <span className={`text-sm font-bold ${getUsageColor(nodeInfo?.diskUsage || 0)}`}>
                  {nodeInfo?.diskUsage || 0}%
                </span>
              </div>
            </div>
          </div>
          {/* ... keep rest of content ... */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Wifi className="h-3 w-3" />
                  Network In
                </div>
                <div className="text-lg font-bold text-blue-500">{nodeInfo?.networkIn || '0 MB/s'}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Wifi className="h-3 w-3" />
                  Network Out
                </div>
                <div className="text-lg font-bold text-purple-500">{nodeInfo?.networkOut || '0 MB/s'}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Settings className="h-3 w-3" />
                  SMS API
                </div>
                <Badge variant={nodeInfo?.smsApiStatus === 'connected' ? 'default' : 'destructive'}>
                  {nodeInfo?.smsApiStatus || 'disconnected'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidatorNodeInfo;
