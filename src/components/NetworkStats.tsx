
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Network, Gauge, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NetworkData {
  chainId: number;
  blockNumber: number;
  peerCount: number;
  syncStatus: string;
  hashRate: string;
  difficulty: string;
  gasPrice: string;
  pendingTransactions: number;
}

const NetworkStats = () => {
  const { data: networkData, isLoading, error } = useQuery({
    queryKey: ['networkStats'],
    queryFn: async (): Promise<NetworkData> => {
      const response = await fetch('/rpc', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "afro_getNetworkStats",
          params: [],
          id: 1
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

  if (isLoading) {
    return <div className="animate-pulse">Loading network stats...</div>;
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">No Data</CardTitle>
              <Network className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-</div>
              <p className="text-xs text-red-500">Validator offline</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chain ID</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.chainId || 0}</div>
          <p className="text-xs text-muted-foreground">Afro Network</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.blockNumber?.toLocaleString() || 0}</div>
          <Badge variant={networkData?.syncStatus === 'synced' ? 'default' : 'secondary'}>
            {networkData?.syncStatus || 'unknown'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected Peers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.peerCount || 0}</div>
          <p className="text-xs text-muted-foreground">Active connections</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hash Rate</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.hashRate || '0 H/s'}</div>
          <p className="text-xs text-muted-foreground">Network power</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkStats;
