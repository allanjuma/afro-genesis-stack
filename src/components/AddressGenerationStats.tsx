
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
      // Fetch from validator API
      try {
        const response = await fetch('/api/validator/address-stats');
        if (response.ok) {
          const data = await response.json();
          // Convert timestamp strings back to Date objects
          data.recentGenerations = data.recentGenerations.map((gen: any) => ({
            ...gen,
            timestamp: new Date(gen.timestamp)
          }));
          return data;
        }
      } catch (error) {
        console.log('API not available, using mock data for display');
      }

      // Fallback mock data
      return {
        totalGenerated: 1247,
        pendingGenerations: 3,
        avgAttempts: 125000,
        recentGenerations: [
          {
            id: '1',
            msisdn: '254700000001',
            status: 'completed',
            attempts: 89234,
            timestamp: new Date(Date.now() - 300000),
            address: 'afro:254700000001:a1b2c3d4e5f67890abcdef1234567890',
            validationSent: true
          },
          {
            id: '2',
            msisdn: '254700000002',
            status: 'pending',
            attempts: 45000,
            timestamp: new Date(Date.now() - 120000),
            validationSent: false
          },
          {
            id: '3',
            msisdn: '254700000003',
            status: 'completed',
            attempts: 156789,
            timestamp: new Date(Date.now() - 600000),
            address: 'afro:254700000003:f9e8d7c6b5a4938271605f4e3d2c1b0a',
            validationSent: true
          }
        ]
      };
    },
    refetchInterval: 3000
  });

  const generateAddressMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/validator/generate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: '254000000000'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate address');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Address Generation Started",
        description: `Generating address for 254000000000. This may take several minutes.`,
      });
      
      // Refresh the stats
      queryClient.invalidateQueries({ queryKey: ['addressGenerationStats'] });
    },
    onError: (error) => {
      console.error('Address generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not start address generation. Validator may not be available.",
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
