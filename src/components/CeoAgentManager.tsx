import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Info, Settings, List, Plus, Edit, Brain, Sparkles, Zap, Server, Activity, Database, Globe, Eye, Container, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type CeoStackStatus = {
  mainnet: boolean;
  testnet: boolean;
  explorer: boolean;
  website: boolean;
  ceo: boolean;
};

type ContainerInfo = {
  name: string;
  status: 'running' | 'stopped' | 'error';
  cpu: number;
  memory: number;
  uptime: string;
  ports: string[];
  image: string;
};

type Proposal = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

type AgenticProposal = {
  id: string;
  title: string;
  category: string;
  description: string;
  generatedAt: string;
  published: boolean;
}

// Simple node ID generator for demo purposes
const getNodeId = () => {
  if (typeof window !== 'undefined') {
    let nodeId = localStorage.getItem('nodeId');
    if (!nodeId) {
      nodeId = 'node-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('nodeId', nodeId);
    }
    return nodeId;
  }
  return 'node-' + Math.random().toString(36).substr(2, 9);
};

const useAgenticProposals = () => {
  const [agentic, setAgentic] = useState<AgenticProposal[]>([]);
  const [isLoading, setLoading] = useState(true);

  const fetchAgentic = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ceo/agentic-proposals");
      if (!res.ok) throw new Error("Failed to fetch agentic proposals");
      setAgentic(await res.json());
    } catch (e) {
      console.error(e);
      setAgentic([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentic();
    const intv = setInterval(fetchAgentic, 15000);
    return () => clearInterval(intv);
  }, []);

  return { agentic, isLoading, fetchAgentic };
};

export default function CeoAgentManager() {
  const [loadingOp, setLoadingOp] = useState<string | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [generationProgress, setGenerationProgress] = useState({
    isGenerating: false,
    step: '',
    progress: 0
  });
  const nodeId = getNodeId();
  const queryClient = useQueryClient();

  // Mock container data - in real implementation, this would come from Docker API
  const containers: ContainerInfo[] = [
    { name: 'afro-validator', status: 'running', cpu: 45, memory: 512, uptime: '2d 4h', ports: ['8545', '30303'], image: 'afro/validator:latest' },
    { name: 'afro-testnet-validator', status: 'running', cpu: 32, memory: 384, uptime: '2d 4h', ports: ['8547', '30304'], image: 'afro/validator:latest' },
    { name: 'afro-explorer', status: 'running', cpu: 28, memory: 256, uptime: '2d 3h', ports: ['4000'], image: 'afro/explorer:latest' },
    { name: 'afro-testnet-explorer', status: 'running', cpu: 25, memory: 256, uptime: '2d 3h', ports: ['4001'], image: 'afro/explorer:latest' },
    { name: 'afro-db', status: 'running', cpu: 15, memory: 128, uptime: '2d 4h', ports: ['5432'], image: 'postgres:14' },
    { name: 'afro-testnet-db', status: 'running', cpu: 12, memory: 128, uptime: '2d 4h', ports: ['5432'], image: 'postgres:14' },
    { name: 'afro-web', status: 'running', cpu: 8, memory: 64, uptime: '2d 2h', ports: ['80'], image: 'afro/web:latest' },
    { name: 'afro-ceo', status: 'running', cpu: 35, memory: 192, uptime: '1d 8h', ports: ['3000'], image: 'afro/ceo:latest' },
  ];

  // Fetch CEO Agent status
  const { data: stackStatus, refetch, isLoading, error } = useQuery({
    queryKey: ["ceoStackStatus"],
    queryFn: async (): Promise<CeoStackStatus> => {
      const res = await fetch("/api/ceo/stack-status");
      if (!res.ok) throw new Error("Failed to get stack status");
      return await res.json();
    },
    refetchInterval: 7000,
  });

  // CEO stack operation mutation (start, stop, restart)
  const { mutate: operate, isPending } = useMutation({
    mutationFn: async (operation: "start" | "stop" | "restart") => {
      setLoadingOp(operation);
      const res = await fetch("/api/ceo/stack-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          services: ["ceo"],
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Operation failed");
      }
      return data;
    },
    onSuccess: (data, op) => {
      toast({
        title: `CEO Agent ${op}`,
        description: data.message,
      });
      refetch();
      setLoadingOp(null);
    },
    onError: (e: any) => {
      toast({
        title: "CEO Agent operation failed",
        description: e.message || "Error",
        variant: "destructive"
      });
      setLoadingOp(null);
    }
  });

  // Container operation mutation
  const { mutate: operateContainer } = useMutation({
    mutationFn: async ({ container, operation }: { container: string, operation: string }) => {
      const res = await fetch("/api/ceo/container-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container, operation }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Operation failed");
      }
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Container ${variables.operation}`,
        description: `${variables.container} ${variables.operation} successful`,
      });
    },
    onError: (e: any, variables) => {
      toast({
        title: "Container operation failed",
        description: e.message || "Error",
        variant: "destructive"
      });
    }
  });

  // --- DAO Proposal features ---
  // Fetch proposals
  const { data: proposals, refetch: refetchProposals, isLoading: loadingProposals } = useQuery({
    queryKey: ["daoProposals"],
    queryFn: async (): Promise<Proposal[]> => {
      const res = await fetch("/api/ceo/proposals");
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return await res.json();
    },
    refetchInterval: 15000,
  });

  // Create proposal
  const createProposal = useMutation({
    mutationFn: async ({ title, description }: { title: string, description: string }) => {
      const res = await fetch("/api/ceo/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          createdBy: nodeId
        })
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Proposal created",
        description: data.message || "Proposal submitted"
      });
      setProposalTitle("");
      setProposalDesc("");
      setShowProposalForm(false);
      queryClient.invalidateQueries({ queryKey: ["daoProposals"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create proposal",
        description: error?.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Edit proposal (only if owned)
  const editProposal = useMutation({
    mutationFn: async ({ id, title, description }: { id: string, title: string, description: string }) => {
      const res = await fetch(`/api/ceo/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, nodeId })
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Proposal updated", description: data.message || "Edit successful" });
      setEditingProposal(null);
      setProposalTitle("");
      setProposalDesc("");
      setShowProposalForm(false);
      queryClient.invalidateQueries({ queryKey: ["daoProposals"] });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update proposal", description: e?.message || "Try again", variant: "destructive" });
    }
  });

  // Agentic proposals (AI-generated)
  const agenticHook = useAgenticProposals();

  // Manual AI proposal generation
  const generateProposal = useMutation({
    mutationFn: async () => {
      setGenerationProgress({ isGenerating: true, step: 'Initializing...', progress: 10 });
      
      const res = await fetch("/api/ceo/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId })
      });
      
      if (!res.ok) throw new Error("Failed to generate proposal");
      return await res.json();
    },
    onSuccess: (data) => {
      setGenerationProgress({ isGenerating: false, step: 'Complete!', progress: 100 });
      toast({
        title: "AI Proposal Generated",
        description: data.message || "New proposal created successfully"
      });
      agenticHook.fetchAgentic();
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, step: '', progress: 0 });
      }, 2000);
    },
    onError: (error: any) => {
      setGenerationProgress({ isGenerating: false, step: 'Failed', progress: 0 });
      toast({
        title: "Failed to generate proposal",
        description: error?.message || "Something went wrong",
        variant: "destructive"
      });
      setTimeout(() => {
        setGenerationProgress({ isGenerating: false, step: '', progress: 0 });
      }, 2000);
    }
  });

  // Track generation progress
  useEffect(() => {
    if (generationProgress.isGenerating) {
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev.progress < 90) {
            const newProgress = prev.progress + 10;
            let step = prev.step;
            
            if (newProgress >= 20 && newProgress < 40) {
              step = 'Analyzing network status...';
            } else if (newProgress >= 40 && newProgress < 60) {
              step = 'Querying Ollama AI...';
            } else if (newProgress >= 60 && newProgress < 80) {
              step = 'Processing response...';
            } else if (newProgress >= 80) {
              step = 'Finalizing proposal...';
            }
            
            return { ...prev, progress: newProgress, step };
          }
          return prev;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [generationProgress.isGenerating]);

  // Publish (owner promotes draft to DAO)
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch("/api/ceo/agentic-proposals/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, createdBy: nodeId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to publish");
      toast({ title: "Published proposal", description: data.message });
      agenticHook.fetchAgentic();
      queryClient.invalidateQueries({ queryKey: ["daoProposals"] });
    } catch (e: any) {
      toast({ title: "Failed to publish", description: e.message, variant: "destructive" });
    } finally {
      setPublishingId(null);
    }
  };

  const getContainerIcon = (name: string) => {
    if (name.includes('validator')) return Server;
    if (name.includes('explorer')) return Eye;
    if (name.includes('db')) return Database;
    if (name.includes('web')) return Globe;
    if (name.includes('ceo')) return Brain;
    return Container;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // -------- Render ----------
  return (
    <div className="space-y-6">
      {/* CEO Agent Overview Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            CEO Agent Control Center
            {isLoading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : stackStatus?.ceo ? (
              <Badge variant="default" className="bg-green-500">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Comprehensive management interface for the AI-powered CEO Agent and all network containers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => operate("start")}
              disabled={loadingOp === "start" || isPending || stackStatus?.ceo}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Start CEO
            </Button>
            <Button
              variant="outline"
              onClick={() => operate("stop")}
              disabled={loadingOp === "stop" || isPending || !stackStatus?.ceo}
              className="flex items-center gap-2"
            >
              <Terminal className="h-4 w-4" />
              Stop CEO
            </Button>
            <Button
              variant="secondary"
              onClick={() => operate("restart")}
              disabled={loadingOp === "restart" || isPending || !stackStatus?.ceo}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Restart CEO
            </Button>
            <Button
              variant="ghost"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="containers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="containers" className="flex items-center gap-2">
            <Container className="h-4 w-4" />
            Container Management
          </TabsTrigger>
          <TabsTrigger value="ai-proposals" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Proposals
          </TabsTrigger>
          <TabsTrigger value="dao-proposals" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            DAO Governance
          </TabsTrigger>
          <TabsTrigger value="system-overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Overview
          </TabsTrigger>
        </TabsList>

        {/* Container Management Tab */}
        <TabsContent value="containers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5" />
                Container Fleet Management
              </CardTitle>
              <CardDescription>
                Monitor and control all Afro Network containers from this centralized interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {containers.map((container) => {
                  const IconComponent = getContainerIcon(container.name);
                  return (
                    <Card key={container.name} className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium text-sm">{container.name}</span>
                          </div>
                          <Badge className={getStatusColor(container.status)}>
                            {container.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Cpu className="h-3 w-3" />
                            <span>CPU: {container.cpu}%</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full" 
                                style={{ width: `${container.cpu}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <MemoryStick className="h-3 w-3" />
                            <span>RAM: {container.memory}MB</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="h-3 w-3" />
                            <span>Uptime: {container.uptime}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {container.ports.map(port => (
                            <Badge key={port} variant="outline" className="text-xs">
                              :{port}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => operateContainer({ container: container.name, operation: 'restart' })}
                          >
                            Restart
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => operateContainer({ container: container.name, operation: container.status === 'running' ? 'stop' : 'start' })}
                          >
                            {container.status === 'running' ? 'Stop' : 'Start'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Proposals Tab */}
        <TabsContent value="ai-proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI-Generated Proposals
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles size={12} className="mr-1" />
                      Powered by Ollama
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered governance proposals generated automatically based on network analysis.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  disabled={generationProgress.isGenerating || generateProposal.isPending}
                  onClick={() => generateProposal.mutate()}
                  className="flex items-center gap-2"
                >
                  <Zap size={16} />
                  {generationProgress.isGenerating ? "Generating..." : "Generate New Proposal"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress tracking */}
              {generationProgress.isGenerating && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="text-purple-500 animate-pulse" size={18} />
                    <span className="font-medium">Creating AI Proposal</span>
                  </div>
                  <Progress value={generationProgress.progress} className="mb-2" />
                  <div className="text-sm text-muted-foreground">{generationProgress.step}</div>
                </div>
              )}

              <div className="space-y-3">
                {agenticHook.isLoading ? (
                  <div className="text-center text-muted-foreground py-8">Loading AI recommendations...</div>
                ) : agenticHook.agentic.length === 0 && !generationProgress.isGenerating ? (
                  <div className="text-center text-muted-foreground py-8">
                    No AI recommendations yet. Generate your first proposal above.
                  </div>
                ) : (
                  agenticHook.agentic.map((draft) => (
                    <Card key={draft.id} className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {draft.title}
                            <Badge variant="outline" className="text-xs capitalize">
                              {draft.category}
                            </Badge>
                          </CardTitle>
                          <Button
                            size="sm"
                            disabled={publishingId === draft.id}
                            onClick={() => handlePublish(draft.id)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {publishingId === draft.id ? "Publishing..." : "Publish to DAO"}
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          Generated: {(new Date(draft.generatedAt)).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{draft.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DAO Proposals Tab */}
        <TabsContent value="dao-proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5 text-primary" />
                    DAO Governance Proposals
                  </CardTitle>
                  <CardDescription>
                    Community-driven proposals for network governance and improvements.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowProposalForm(true);
                    setEditingProposal(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Proposal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ... keep existing code (proposal form and list) */}
              {showProposalForm && (
                <div className="mb-6 border p-4 rounded-lg bg-background">
                  <h3 className="font-semibold mb-3">
                    {editingProposal ? "Edit Proposal" : "Create New Proposal"}
                  </h3>
                  <div className="space-y-3">
                    <input
                      className="w-full border rounded p-3"
                      value={proposalTitle}
                      onChange={e => setProposalTitle(e.target.value)}
                      placeholder="Proposal title"
                      maxLength={80}
                    />
                    <textarea
                      className="w-full border rounded p-3"
                      value={proposalDesc}
                      onChange={e => setProposalDesc(e.target.value)}
                      placeholder="Describe your proposal in detail"
                      rows={4}
                      maxLength={2000}
                    />
                    <div className="flex gap-2">
                      <Button
                        disabled={!proposalTitle || !proposalDesc || createProposal.isPending || editProposal.isPending}
                        onClick={() => {
                          if (editingProposal) {
                            editProposal.mutate({ id: editingProposal.id, title: proposalTitle, description: proposalDesc });
                          } else {
                            createProposal.mutate({ title: proposalTitle, description: proposalDesc });
                          }
                        }}>
                        {editingProposal ? "Save Changes" : "Submit Proposal"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowProposalForm(false);
                          setEditingProposal(null);
                          setProposalTitle("");
                          setProposalDesc("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {loadingProposals ? (
                  <div className="text-center text-muted-foreground py-8">Loading proposals...</div>
                ) : proposals?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No proposals yet. Create the first one!</div>
                ) : (
                  proposals?.map((prop) => (
                    <Card key={prop.id} className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{prop.title}</CardTitle>
                          {prop.createdBy === nodeId && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingProposal(prop);
                                setProposalTitle(prop.title);
                                setProposalDesc(prop.description);
                                setShowProposalForm(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Edit size={14} />
                              Edit
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center text-sm">
                          <span>By:</span>
                          <Badge variant={prop.createdBy === nodeId ? "default" : "outline"}>
                            {prop.createdBy === nodeId ? "You" : prop.createdBy.slice(0, 8) + "..."}
                          </Badge>
                          <span className="text-muted-foreground ml-2">
                            {(new Date(prop.createdAt)).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{prop.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Overview Tab */}
        <TabsContent value="system-overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-500" />
                  Validators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">2</div>
                <p className="text-xs text-muted-foreground">Active validator nodes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-500" />
                  Explorers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">2</div>
                <p className="text-xs text-muted-foreground">Block explorers running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  Databases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">2</div>
                <p className="text-xs text-muted-foreground">PostgreSQL instances</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-orange-500" />
                  AI Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">1</div>
                <p className="text-xs text-muted-foreground">CEO Agent active</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Resource Usage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total CPU Usage</span>
                    <span>28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Memory Usage</span>
                    <span>1.8GB / 8GB</span>
                  </div>
                  <Progress value={22} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Network I/O</span>
                    <span>Active</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Terminal size={16} />
            <span>
              For detailed container logs and system diagnostics, visit the <strong>Logs</strong> tab. 
              Select <strong>CEO Service</strong> (<code>afro-ceo</code>) to view AI agent activity.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
