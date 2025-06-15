
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Wifi, Settings, AlertCircle, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ValidatorEditableSettings from "./ValidatorEditableSettings";
import React from "react";

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

  // Enode URL fetcher
  const { data: enodeUrl, isLoading: loadingEnode, error: enodeError, refetch: refetchEnode } = useQuery({
    queryKey: ['validatorEnodeUrl'],
    queryFn: async () => {
      const res = await fetch('/api/validator/enode_url.txt?' + Date.now());
      if (!res.ok) throw new Error("Cannot fetch enode URL");
      const v = await res.text();
      return v.trim();
    },
    refetchInterval: 8000,
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
          {/* Enode URL display */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-2">
              Node Enode URL
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border rounded p-2">
              {loadingEnode ? (
                <span className="animate-pulse text-gray-400">Fetching enode URL...</span>
              ) : enodeError ? (
                <span className="text-red-500">Not available</span>
              ) : enodeUrl ? (
                <>
                  <span className="break-all text-xs">{enodeUrl}</span>
                  <button
                    className="ml-2 p-1 rounded hover:bg-gray-100"
                    aria-label="Copy enode URL"
                    onClick={() => {
                      navigator.clipboard.writeText(enodeUrl);
                    }}
                    type="button"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-gray-400">Not available</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Share this enode URL for peers to connect to your node.
            </div>
          </div>
          {/* End enode URL display */}

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
