
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Hash, Clock, CheckCircle, Plus, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface AddressGeneration {
  id: string;
  msisdn: string;
  status: 'pending' | 'completed' | 'failed';
  attempts: number;
  timestamp: Date | string;
  address?: string;
  validationSent: boolean;
}

interface AddressGenerationStatsData {
  totalGenerated: number;
  pendingGenerations: number;
  avgAttempts: number;
  recentGenerations: AddressGeneration[];
}

const AddressGenerationStats = () => {
  const queryClient = useQueryClient();

  const [customMsisdn, setCustomMsisdn] = useState("254000000000");
  const [testGenerations, setTestGenerations] = useState<AddressGeneration[]>([]);

  const { data: generationStats, isLoading, error } = useQuery({
    queryKey: ['addressGenerationStats'],
    queryFn: async (): Promise<AddressGenerationStatsData> => {
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
        
        // If validator is not available (404), return fallback data
        if (response.status === 404) {
          console.log('⚠️ Validator not available, using fallback data');
          return {
            totalGenerated: 0,
            pendingGenerations: 0,
            avgAttempts: 0,
            recentGenerations: []
          };
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        console.error('❌ Failed to fetch from validator:', error);
        // Return fallback data instead of throwing
        console.log('📦 Using fallback data due to validator unavailability');
        return {
          totalGenerated: 0,
          pendingGenerations: 0,
          avgAttempts: 0,
          recentGenerations: []
        };
      }
    },
    refetchInterval: (data) => {
      return data && data.totalGenerated > 0 ? 3000 : false;
    },
    retry: 1,
    retryDelay: 5000,
  });

  const generateAddressMutation = useMutation({
    mutationFn: async ({ msisdn, test }: { msisdn: string; test: boolean }) => {
      if (test) {
        // Fake test generation without blockchain inclusion:
        return {
          id: "test-" + Date.now(),
          msisdn,
          status: "completed",
          attempts: 1,
          timestamp: new Date(),
          validationSent: false,
          test: true,
        };
      }
      const response = await fetch('/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'afro_generateAddress',
          params: [msisdn],
          id: 2
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Validator service is not available');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Validator returned an error');
      }

      return { ...data.result, msisdn, test: false };
    },
    onSuccess: (data, { test }) => {
      if (test) {
        setTestGenerations(prev => [
          {
            id: data.id,
            msisdn: data.msisdn,
            status: data.status,
            attempts: data.attempts,
            timestamp: data.timestamp,
            validationSent: data.validationSent,
            test: true,
          },
          ...prev
        ]);
        toast({
          title: "Test Address Generated",
          description: `Test address for ${data.msisdn} generated (not on blockchain).`,
        });
      } else {
        toast({
          title: "Address Generation Started",
          description: `Generating address for ${data.msisdn}. This may take several minutes.`,
        });
        queryClient.invalidateQueries({ queryKey: ['addressGenerationStats'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: `Could not start address generation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading address stats...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading generation stats.</div>;
  }

  const totalGenerated = generationStats?.totalGenerated ?? 0;
  const pendingGenerations = generationStats?.pendingGenerations ?? 0;
  const avgAttempts = generationStats?.avgAttempts ?? 0;
  const recentGenerations = generationStats?.recentGenerations ?? [];

  const getStatusBadge = (status: string, test?: boolean) => {
    if (test) {
      return <Badge variant="secondary" className="bg-blue-500">Test</Badge>;
    }
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

  const isValidatorUnavailable =
    !generationStats ||
    (generationStats.totalGenerated === 0 &&
      generationStats.pendingGenerations === 0 &&
      generationStats.recentGenerations.length === 0);

  // Merge test addresses (top) with real recentGenerations for display
  const displayedGenerations = [
    ...(testGenerations || []),
    ...(generationStats?.recentGenerations || [])
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Address Generation</h2>
          <p className="text-sm text-muted-foreground">Generate and track Afro Network addresses</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateAddressMutation.mutate({ msisdn: customMsisdn, test: true });
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={customMsisdn}
            onChange={e => setCustomMsisdn(e.target.value)}
            maxLength={15}
            className="max-w-[155px]"
            type="tel"
            pattern="\d{10,15}"
            title="Enter MSISDN (Eg. 254700000000)"
            required
            disabled={generateAddressMutation.isPending}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={generateAddressMutation.isPending}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {generateAddressMutation.isPending ? 'Generating...' : 'Generate Test Address'}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={generateAddressMutation.isPending || isValidatorUnavailable}
            onClick={() => generateAddressMutation.mutate({ msisdn: customMsisdn, test: false })}
            className="flex items-center gap-2"
            title={isValidatorUnavailable ? "Validator must be online" : "Generate on Blockchain"}
          >
            <Plus className="h-4 w-4" />
            {generateAddressMutation.isPending ? 'Generating...' : 'Generate on Blockchain'}
          </Button>
        </form>
      </div>

      {isValidatorUnavailable && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <CardTitle className="text-sm font-medium text-yellow-800">Validator Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              The validator service is not running or accessible. Address generation functionality is disabled.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGenerated}</div>
            <p className="text-xs text-muted-foreground">Addresses created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGenerations}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attempts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttempts}</div>
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
          {!displayedGenerations.length ? (
            <div className="text-center py-8 text-muted-foreground">
              {isValidatorUnavailable
                ? 'No data available - validator service offline'
                : 'No recent address generations'}
            </div>
          ) : (
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
                {displayedGenerations.map((gen) => (
                  <TableRow key={gen.id}>
                    <TableCell className="font-mono">{gen.msisdn}</TableCell>
                    <TableCell>
                      {getStatusBadge(gen.status, (gen as any).test)}
                    </TableCell>
                    <TableCell>{gen.attempts?.toLocaleString?.() ?? "-"}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressGenerationStats;
