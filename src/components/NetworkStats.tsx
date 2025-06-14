
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
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['networkStats'],
    queryFn: async (): Promise<NetworkData> => {
      // Mock data for development - in production this would fetch from RPC
      return {
        chainId: 7878,
        blockNumber: 12345,
        peerCount: 8,
        syncStatus: "synced",
        hashRate: "1.2 MH/s",
        difficulty: "0x1bc16d674ec80000",
        gasPrice: "20 Gwei",
        pendingTransactions: 3
      };
    },
    refetchInterval: 5000
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading network stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chain ID</CardTitle>
          <Network className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.chainId}</div>
          <p className="text-xs text-muted-foreground">Afro Mainnet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.blockNumber.toLocaleString()}</div>
          <Badge variant={networkData?.syncStatus === 'synced' ? 'default' : 'secondary'}>
            {networkData?.syncStatus}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected Peers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.peerCount}</div>
          <p className="text-xs text-muted-foreground">Active connections</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hash Rate</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{networkData?.hashRate}</div>
          <p className="text-xs text-muted-foreground">Network power</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkStats;
