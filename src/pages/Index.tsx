
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkStats from "@/components/NetworkStats";
import AddressGenerationStats from "@/components/AddressGenerationStats";
import ValidatorNodeInfo from "@/components/ValidatorNodeInfo";
import { Activity, Network, Phone, Server } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-purple-900/20 to-green-900/20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-green-500 rounded-xl">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                Afro Network Validator Dashboard
              </h1>
              <p className="text-gray-400 text-lg">Monitor network performance and validator operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Tabs defaultValue="network" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 border border-gray-700">
            <TabsTrigger 
              value="network" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger 
              value="addresses" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Phone className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger 
              value="validator" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Server className="h-4 w-4" />
              Validator
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-6">
            <NetworkStats />
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Network Overview</CardTitle>
                <CardDescription className="text-gray-400">Current state of the Afro Network blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p>The network is currently processing transactions and mining new blocks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p>Mobile money address generation is active with SMS validation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p>RPC endpoints are available for external connections</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p>Block explorer is running and accessible</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <AddressGenerationStats />
          </TabsContent>

          <TabsContent value="validator" className="space-y-6">
            <ValidatorNodeInfo />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">System Logs</CardTitle>
                <CardDescription className="text-gray-400">Recent validator and network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto border border-gray-800">
                  <div className="space-y-1">
                    <div className="text-green-300">[2024-06-14 15:30:15] <span className="text-blue-400">INFO:</span> Validator started successfully</div>
                    <div className="text-green-300">[2024-06-14 15:30:16] <span className="text-blue-400">INFO:</span> Connected to 8 peers</div>
                    <div className="text-green-300">[2024-06-14 15:30:45] <span className="text-blue-400">INFO:</span> Block #12345 mined with 3 transactions</div>
                    <div className="text-green-300">[2024-06-14 15:31:02] <span className="text-blue-400">INFO:</span> Address generation request from 254700000001</div>
                    <div className="text-green-300">[2024-06-14 15:31:15] <span className="text-blue-400">INFO:</span> SMS validation sent to 254700000001</div>
                    <div className="text-green-300">[2024-06-14 15:31:30] <span className="text-blue-400">INFO:</span> Address afro:254700000001:a1b2c3... generated successfully</div>
                    <div className="text-green-300">[2024-06-14 15:32:01] <span className="text-blue-400">INFO:</span> Transaction fee validated for 254700000002</div>
                    <div className="text-green-300">[2024-06-14 15:32:15] <span className="text-blue-400">INFO:</span> Starting brute-force search for 254700000002</div>
                    <div className="text-yellow-400">[2024-06-14 15:32:45] <span className="text-orange-400">WARN:</span> Address generation attempt 50000 for 254700000002</div>
                    <div className="text-green-300">[2024-06-14 15:33:12] <span className="text-blue-400">INFO:</span> Block #12346 includes 2 new addresses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
