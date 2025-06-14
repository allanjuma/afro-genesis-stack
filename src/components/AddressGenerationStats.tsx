
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Hash, Clock, CheckCircle, Plus, AlertCircle, TestTube } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface AddressGeneration {
  id: string;
  msisdn: string;
  status: 'pending' | 'completed' | 'failed';
  attempts: number;
  timestamp: Date | string;
  address?: string;
  validationSent: boolean;
  isTest?: boolean;
}

const AddressGenerationStats = () => {
  const queryClient = useQueryClient();
  const [customMsisdn, setCustomMsisdn] = useState('');

  const { data: generationStats, isLoading, error } = useQuery({
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
      // Only refetch if we have real data (not fallback), otherwise stop polling
      return data && data.totalGenerated > 0 ? 3000 : false;
    },
    retry: 1, // Reduce retry attempts
    retryDelay: 5000 // Wait longer between retries
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
        if (response.status === 404) {
          throw new Error('Validator service is not available');
        }
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

  const generateTestAddressMutation = useMutation({
    mutationFn: async (msisdn: string) => {
      console.log('🧪 Generating test address for MSISDN:', msisdn);
      
      // Generate a test address locally without calling the validator
      const prefix = `afro:${msisdn}:`;
      const extraChars = Math.random().toString(16).substr(2, 32).padEnd(32, '0');
      const testAddress = `${prefix}${extraChars}`;
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `test-${Date.now()}`,
        msisdn,
        address: testAddress,
        status: 'completed',
        attempts: 1,
        timestamp: new Date().toISOString(),
        validationSent: false,
        isTest: true
      };
    },
    onSuccess: (data) => {
      console.log('✅ Test address generated successfully:', data);
      
      toast({
        title: "Test Address Generated",
        description: `Test address created for ${data.msisdn}: ${data.address}`,
      });
      
      // Add the test address to the local data
      queryClient.setQueryData(['addressGenerationStats'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          recentGenerations: [data, ...oldData.recentGenerations].slice(0, 10)
        };
      });
    },
    onError: (error) => {
      console.error('❌ Test address generation error:', error);
      toast({
        title: "Test Generation Failed",
        description: `Could not generate test address: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleGenerateTestAddress = () => {
    if (!customMsisdn.trim()) {
      toast({
        title: "Invalid MSISDN",
        description: "Please enter a valid MSISDN number",
        variant: "destructive"
      });
      return;
    }
    generateTestAddressMutation.mutate(customMsisdn);
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading address generation stats...</div>;
  }

  const getStatusBadge = (status: string, isTest?: boolean) => {
    if (isTest) {
      return <Badge variant="outline" className="border-blue-500 text-blue-600"><TestTube className="h-3 w-3 mr-1" />Test</Badge>;
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

  const isValidatorUnavailable = !generationStats || (generationStats.totalGenerated === 0 && generationStats.pendingGenerations === 0 && generationStats.recentGenerations.length === 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Address Generation</h2>
          <p className="text-sm text-muted-foreground">Generate and track Afro Network addresses</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateAddressMutation.mutate()}
            disabled={generateAddressMutation.isPending || isValidatorUnavailable}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {generateAddressMutation.isPending ? 'Generating...' : 'Generate Address'}
          </Button>
        </div>
      </div>

      {/* Test Address Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Address Generation
          </CardTitle>
          <CardDescription>Generate test addresses with custom MSISDN (not added to blockchain)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom MSISDN (e.g., 254123456789)"
              value={customMsisdn}
              onChange={(e) => setCustomMsisdn(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleGenerateTestAddress}
              disabled={generateTestAddressMutation.isPending}
              variant="outline"
            >
              {generateTestAddressMutation.isPending ? 'Generating...' : 'Generate Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isValidatorUnavailable && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <CardTitle className="text-sm font-medium text-yellow-800">Validator Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              The validator service is not running or accessible. Blockchain address generation is disabled, but test addresses can still be generated.
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
            <div className="text-2xl font-bold">{generationStats?.totalGenerated?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Addresses created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationStats?.pendingGenerations || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attempts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generationStats?.avgAttempts?.toLocaleString() || 0}</div>
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
          {!generationStats?.recentGenerations?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              {isValidatorUnavailable ? 'No data available - validator service offline' : 'No recent address generations'}
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
                {generationStats.recentGenerations.map((gen) => (
                  <TableRow key={gen.id}>
                    <TableCell className="font-mono">{gen.msisdn}</TableCell>
                    <TableCell>{getStatusBadge(gen.status, gen.isTest)}</TableCell>
                    <TableCell>{gen.attempts.toLocaleString()}</TableCell>
                    <TableCell>{formatTimestamp(gen.timestamp)}</TableCell>
                    <TableCell>
                      {gen.isTest ? (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      ) : gen.validationSent ? (
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
