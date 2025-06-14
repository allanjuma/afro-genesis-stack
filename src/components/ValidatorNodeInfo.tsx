import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Wifi, Settings } from "lucide-react";
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
  const { data: nodeInfo, isLoading, refetch } = useQuery({
    queryKey: ['validatorNodeInfo'],
    queryFn: async (): Promise<NodeInfo> => {
      // Call actual validator API for settings (replace with real fetch/IPC as needed)
      try {
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
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        if (data.result) return data.result;
        throw new Error("Invalid response structure");
      } catch (e) {
        // fallback client-side demo data if backend isn't ready
        return {
          nodeId: "afro-validator-001",
          version: "v1.2.3",
          uptime: "3d 14h 25m",
          cpuUsage: 45,
          memoryUsage: 68,
          diskUsage: 32,
          networkIn: "1.2 MB/s",
          networkOut: "0.8 MB/s",
          validatorPhone: "254700000002",
          smsApiStatus: "connected",
          pendingAddresses: 2
        };
      }
    },
    refetchInterval: 5000
  });

  // Save endpoint for validator settings
  async function handleSaveSettings(updated: { nodeId: string; validatorPhone: string }) {
    // Wire to actual API
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatorEditableSettings
              settings={{
                nodeId: nodeInfo?.nodeId ?? "",
                validatorPhone: nodeInfo?.validatorPhone ?? ""
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
                  {nodeInfo?.cpuUsage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Memory:
                </span>
                <span className={`text-sm font-bold ${getUsageColor(nodeInfo?.memoryUsage || 0)}`}>
                  {nodeInfo?.memoryUsage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Disk:
                </span>
                <span className={`text-sm font-bold ${getUsageColor(nodeInfo?.diskUsage || 0)}`}>
                  {nodeInfo?.diskUsage}%
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
                <div className="text-lg font-bold text-blue-500">{nodeInfo?.networkIn}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Wifi className="h-3 w-3" />
                  Network Out
                </div>
                <div className="text-lg font-bold text-purple-500">{nodeInfo?.networkOut}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                  <Settings className="h-3 w-3" />
                  SMS API
                </div>
                <Badge variant={nodeInfo?.smsApiStatus === 'connected' ? 'default' : 'destructive'}>
                  {nodeInfo?.smsApiStatus}
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
