
import React, { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Network, Phone, Server, Settings, AlertTriangle } from "lucide-react";
import DarkModeSwitch from "@/components/DarkModeSwitch";
import ValidatorAPI from "@/components/ValidatorAPI";

// Lazy load components for better performance
const NetworkStats = React.lazy(() => import("@/components/NetworkStats"));
const AddressGenerationStats = React.lazy(() => import("@/components/AddressGenerationStats"));
const ValidatorNodeInfo = React.lazy(() => import("@/components/ValidatorNodeInfo"));
const StackManager = React.lazy(() => import("@/components/StackManager"));
const EndpointManager = React.lazy(() => import("@/components/EndpointManager"));
const ServiceLogs = React.lazy(() => import("@/components/ServiceLogs"));
const CeoAgentManager = React.lazy(() => import("@/components/CeoAgentManager"));

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

const Index = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-6">
        <ValidatorAPI />
        
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
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <NetworkStats />
                  <EndpointManager />
                </Suspense>
              </ErrorBoundary>
              
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
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <AddressGenerationStats />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="validator" className="space-y-6">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <ValidatorNodeInfo />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="stack" className="space-y-6">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <StackManager />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="ceo" className="space-y-6">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <CeoAgentManager />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>
                    View recent activity and errors from all stack services. To see CEO Agent logs, select <b>CEO Service</b> (<code>afro-ceo</code>) in the dropdown below.
                  </CardDescription>
                </CardHeader>
              </Card>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <ServiceLogs />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
