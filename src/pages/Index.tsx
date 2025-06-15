
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkStats from "@/components/NetworkStats";
import AddressGenerationStats from "@/components/AddressGenerationStats";
import ValidatorNodeInfo from "@/components/ValidatorNodeInfo";
import StackManager from "@/components/StackManager";
import EndpointManager from "@/components/EndpointManager";
import { Activity, Network, Phone, Server, Settings } from "lucide-react";
import DarkModeSwitch from "@/components/DarkModeSwitch";
import ServiceLogs from "@/components/ServiceLogs";
import CeoAgentManager from "@/components/CeoAgentManager";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-background to-blue-500/5" />
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-8 justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-primary rounded-2xl shadow-glow">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gradient-primary">
                  Afro Network Validator Dashboard
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  Monitor network performance, validator operations, and manage the CEO AI Agent
                </p>
              </div>
            </div>
            <DarkModeSwitch />
          </div>

          <Tabs defaultValue="network" className="space-y-8">
            <TabsList className="grid w-full grid-cols-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1">
              <TabsTrigger value="network" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Network className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Phone className="h-4 w-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="validator" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Server className="h-4 w-4" />
                Validator
              </TabsTrigger>
              <TabsTrigger value="stack" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Settings className="h-4 w-4" />
                Stack Manager
              </TabsTrigger>
              <TabsTrigger value="ceo" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Settings className="h-4 w-4" />
                CEO Agent
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="network" className="space-y-6">
              <NetworkStats />
              <EndpointManager />
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-card">
                <CardHeader>
                  <CardTitle className="text-gradient-primary">Network Overview</CardTitle>
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

            <TabsContent value="ceo" className="space-y-6">
              <CeoAgentManager />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-card">
                <CardHeader>
                  <CardTitle className="text-gradient-primary">System Logs</CardTitle>
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
    </div>
  );
};

export default Index;
