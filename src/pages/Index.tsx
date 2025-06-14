import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkStats from "@/components/NetworkStats";
import AddressGenerationStats from "@/components/AddressGenerationStats";
import ValidatorNodeInfo from "@/components/ValidatorNodeInfo";
import { Activity, Network, Phone, Server } from "lucide-react";
import DarkModeSwitch from "@/components/DarkModeSwitch";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Afro Network Validator Dashboard</h1>
              <p className="text-muted-foreground">Monitor network performance and validator operations</p>
            </div>
          </div>
          <DarkModeSwitch />
        </div>

        <Tabs defaultValue="network" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="validator" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Validator
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-6">
            <NetworkStats />
            <Card>
              <CardHeader>
                <CardTitle>Network Overview</CardTitle>
                <CardDescription>Current state of the Afro Network blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• The network is currently processing transactions and mining new blocks</p>
                  <p>• Mobile money address generation is active with SMS validation</p>
                  <p>• RPC endpoints are available for external connections</p>
                  <p>• Block explorer is running and accessible</p>
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
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent validator and network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                    <div>[2024-06-14 15:30:15] INFO: Validator started successfully</div>
                    <div>[2024-06-14 15:30:16] INFO: Connected to 8 peers</div>
                    <div>[2024-06-14 15:30:45] INFO: Block #12345 mined with 3 transactions</div>
                    <div>[2024-06-14 15:31:02] INFO: Address generation request from 254700000001</div>
                    <div>[2024-06-14 15:31:15] INFO: SMS validation sent to 254700000001</div>
                    <div>[2024-06-14 15:31:30] INFO: Address afro:254700000001:a1b2c3... generated successfully</div>
                    <div>[2024-06-14 15:32:01] INFO: Transaction fee validated for 254700000002</div>
                    <div>[2024-06-14 15:32:15] INFO: Starting brute-force search for 254700000002</div>
                    <div>[2024-06-14 15:32:45] WARN: Address generation attempt 50000 for 254700000002</div>
                    <div>[2024-06-14 15:33:12] INFO: Block #12346 includes 2 new addresses</div>
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
