
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Hash, Clock, CheckCircle, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface AddressGeneration {
  id: string;
  msisdn: string;
  status: 'pending' | 'completed' | 'failed';
  attempts: number;
  timestamp: Date | string;
  address?: string;
  validationSent: boolean;
}

const AddressGenerationStats = () => {
  const queryClient = useQueryClient();

  const { data: generationStats, isLoading } = useQuery({
    queryKey: ['addressGenerationStats'],
    queryFn: async (): Promise<{
      totalGenerated: number;
      pendingGenerations: number;
      avgAttempts: number;
      recentGenerations: AddressGeneration[];
    }> => {
      console.log('🔍 Fetching address generation stats from validator...');
      
      try {
        // Call actual validator API through nginx proxy
        const response = await fetch('/rpc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'afro_getAddressStats',
            params: [],
            id: 1
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Received stats from validator:', data);
          
          if (data.result) {
            // Convert timestamp strings back to Date objects
            data.result.recentGenerations = data.result.recentGenerations.map((gen: any) => ({
              ...gen,
              timestamp: new Date(gen.timestamp)
            }));
            return data.result;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        console.error('❌ Failed to fetch from validator:', error);
        throw error;
      }
    },
    refetchInterval: 3000,
    retry: 2
  });

  const generateAddressMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Calling actual validator to generate address...');
      
      const response = await fetch('/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'afro_generateAddress',
          params: ['254000000000'],
          id: 2
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 Validator response:', data);
      
      if (data.error) {
        throw new Error(data.error.message || 'Validator returned an error');
      }

      return data.result;
    },
    onSuccess: (data) => {
      console.log('✅ Address generation started successfully:', data);
      
      toast({
        title: "Address Generation Started",
        description: `Generating address for 254000000000. This may take several minutes.`,
      });
      
      // Refresh the stats
      queryClient.invalidateQueries({ queryKey: ['addressGenerationStats'] });
    },
    onError: (error) => {
      console.error('❌ Address generation error:', error);
      toast({
        title: "Generation Failed",
        description: `Could not start address generation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading address generation stats...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Address Generation</h2>
          <p className="text-sm text-muted-foreground">Generate and track Afro Network addresses</p>
        </div>
        <Button 
          onClick={() => generateAddressMutation.mutate()}
          disabled={generateAddressMutation.isPending}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {generateAddressMutation.isPending ? 'Generating...' : 'Generate Test Address'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationStats?.totalGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Addresses created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationStats?.pendingGenerations}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attempts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationStats?.avgAttempts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per address</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Address Generations</CardTitle>
          <CardDescription>Latest address generation requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MSISDN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>SMS Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generationStats?.recentGenerations.map((gen) => (
                <TableRow key={gen.id}>
                  <TableCell className="font-mono">{gen.msisdn}</TableCell>
                  <TableCell>{getStatusBadge(gen.status)}</TableCell>
                  <TableCell>{gen.attempts.toLocaleString()}</TableCell>
                  <TableCell>{formatTimestamp(gen.timestamp)}</TableCell>
                  <TableCell>
                    {gen.validationSent ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressGenerationStats;
