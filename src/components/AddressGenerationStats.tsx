
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Phone, Clock, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AddressGeneration {
  id: string;
  msisdn: string;
  address: string;
  attempts: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

interface AddressStats {
  totalGenerated: number;
  pendingGenerations: number;
  avgAttempts: number;
  recentGenerations: AddressGeneration[];
}

const AddressGenerationStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['addressGenerationStats'],
    queryFn: async (): Promise<AddressStats> => {
      // Mock data for development
      return {
        totalGenerated: 1247,
        pendingGenerations: 3,
        avgAttempts: 67543,
        recentGenerations: [
          {
            id: "1",
            msisdn: "254700000001",
            address: "afro:254700000001:a1b2c3d4e5f6",
            attempts: 45234,
            timestamp: "2024-06-14T15:31:30Z",
            status: 'completed'
          },
          {
            id: "2", 
            msisdn: "254700000002",
            address: "afro:254700000002:f6e5d4c3b2a1",
            attempts: 89765,
            timestamp: "2024-06-14T15:25:15Z",
            status: 'completed'
          },
          {
            id: "3",
            msisdn: "254700000003", 
            address: "afro:254700000003:...",
            attempts: 12450,
            timestamp: "2024-06-14T15:32:45Z",
            status: 'pending'
          }
        ]
      };
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading address generation stats...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Generated</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalGenerated?.toLocaleString()}</div>
            <p className="text-xs text-gray-400">
              +12 from last hour
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.pendingGenerations}</div>
            <p className="text-xs text-gray-400">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.avgAttempts?.toLocaleString()}</div>
            <p className="text-xs text-gray-400">
              Per successful address
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Generations */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Phone className="h-5 w-5" />
            Recent Address Generations
          </CardTitle>
          <CardDescription className="text-gray-400">Latest address generation attempts and completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentGenerations?.map((generation) => (
              <div key={generation.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(generation.status)}`}></div>
                  <div>
                    <div className="font-mono text-sm text-white">{generation.msisdn}</div>
                    <div className="text-xs text-gray-400">{new Date(generation.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">{generation.attempts.toLocaleString()} attempts</div>
                  <Badge variant={generation.status === 'completed' ? 'default' : generation.status === 'pending' ? 'secondary' : 'destructive'}>
                    {generation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressGenerationStats;
