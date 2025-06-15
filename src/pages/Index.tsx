
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkStats from "@/components/NetworkStats";
import AddressGenerationStats from "@/components/AddressGenerationStats";
import ValidatorNodeInfo from "@/components/ValidatorNodeInfo";
import StackManager from "@/components/StackManager";
import { Activity, Network, Phone, Server, Settings } from "lucide-react";
import DarkModeSwitch from "@/components/DarkModeSwitch";
import ServiceLogs from "@/components/ServiceLogs";
import CeoAgentManager from "@/components/CeoAgentManager";

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
              <p className="text-muted-foreground">
                Monitor network performance, validator operations, and manage the CEO AI Agent
              </p>
            </div>
          </div>
          <DarkModeSwitch />
        </div>

        <Tabs defaultValue="network" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="stack" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Stack Manager
            </TabsTrigger>
            <TabsTrigger value="ceo" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              CEO Agent
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

          <TabsContent value="stack" className="space-y-6">
            <StackManager />
          </TabsContent>

          {/* CEO AGENT FUNCTIONS */}
          <TabsContent value="ceo" className="space-y-6">
            <CeoAgentManager />
          </TabsContent>

          {/* Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  View recent activity and errors from all stack services. To see CEO Agent logs, select <b>CEO Service</b> (<code>afro-ceo</code>) in the dropdown below.
                </CardDescription>
              </CardHeader>
            </Card>
            <ServiceLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
