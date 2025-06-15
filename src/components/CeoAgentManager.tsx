
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Zap, Activity, List, Plus, Edit, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type CeoStackStatus = {
  mainnet: boolean;
  testnet: boolean;
  explorer: boolean;
  website: boolean;
  ceo: boolean;
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

  // -------- Render ----------
  return (
    <div className="space-y-6">
      {/* CEO Agent Overview Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">CEO Agent Control Center</span>
                {isLoading ? (
                  <Badge variant="secondary" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Loading...
                  </Badge>
                ) : stackStatus?.ceo ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <Activity className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-base">
            AI-powered governance and proposal management system for the Afro Network ecosystem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => operate("start")}
              disabled={loadingOp === "start" || isPending || stackStatus?.ceo}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Zap className="h-4 w-4" />
              {loadingOp === "start" ? "Starting..." : "Start CEO Agent"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => operate("stop")}
              disabled={loadingOp === "stop" || isPending || !stackStatus?.ceo}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {loadingOp === "stop" ? "Stopping..." : "Stop Agent"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => operate("restart")}
              disabled={loadingOp === "restart" || isPending || !stackStatus?.ceo}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {loadingOp === "restart" ? "Restarting..." : "Restart Agent"}
            </Button>
            <Button
              size="lg"
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

      {/* Streamlined Tabbed Interface */}
      <Tabs defaultValue="ai-proposals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="ai-proposals" className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            AI Governance
          </TabsTrigger>
          <TabsTrigger value="dao-proposals" className="flex items-center gap-2 text-sm">
            <List className="h-4 w-4" />
            Community Proposals
          </TabsTrigger>
          <TabsTrigger value="system-info" className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            System Info
          </TabsTrigger>
        </TabsList>

        {/* AI Proposals Tab - Enhanced */}
        <TabsContent value="ai-proposals" className="space-y-6">
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Brain className="h-6 w-6 text-purple-600" />
                    AI-Powered Governance
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      <Sparkles size={12} className="mr-1" />
                      Powered by Ollama
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Advanced AI system that analyzes network performance and generates intelligent governance proposals.
                  </CardDescription>
                </div>
                <Button
                  size="lg"
                  disabled={generationProgress.isGenerating || generateProposal.isPending}
                  onClick={() => generateProposal.mutate()}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Zap size={18} />
                  {generationProgress.isGenerating ? "Generating..." : "Generate Proposal"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Progress tracking */}
              {generationProgress.isGenerating && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="text-purple-600 animate-pulse" size={24} />
                      <div>
                        <h3 className="font-semibold text-lg">AI Analysis in Progress</h3>
                        <p className="text-sm text-muted-foreground">Creating intelligent governance proposal</p>
                      </div>
                    </div>
                    <Progress value={generationProgress.progress} className="mb-3 h-3" />
                    <div className="text-sm font-medium text-purple-700">{generationProgress.step}</div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {agenticHook.isLoading ? (
                  <Card className="border-dashed border-2 border-purple-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
                        <div className="text-lg font-medium text-muted-foreground">Loading AI recommendations...</div>
                      </div>
                    </CardContent>
                  </Card>
                ) : agenticHook.agentic.length === 0 && !generationProgress.isGenerating ? (
                  <Card className="border-dashed border-2 border-purple-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <div className="text-lg font-medium text-muted-foreground mb-2">No AI proposals yet</div>
                        <p className="text-sm text-muted-foreground">Generate your first intelligent proposal using the button above</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  agenticHook.agentic.map((draft) => (
                    <Card key={draft.id} className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 mb-2">
                              <Brain className="h-5 w-5 text-purple-600" />
                              {draft.title}
                              <Badge variant="outline" className="text-xs capitalize bg-white">
                                {draft.category}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-sm">
                              AI Generated: {(new Date(draft.generatedAt)).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Button
                            disabled={publishingId === draft.id}
                            onClick={() => handlePublish(draft.id)}
                            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                          >
                            <Zap className="h-4 w-4" />
                            {publishingId === draft.id ? "Publishing..." : "Publish to DAO"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{draft.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced DAO Proposals Tab */}
        <TabsContent value="dao-proposals" className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <List className="h-6 w-6 text-blue-600" />
                    Community Governance
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Community-driven proposals for network governance and improvements.
                  </CardDescription>
                </div>
                <Button 
                  size="lg"
                  onClick={() => {
                    setShowProposalForm(true);
                    setEditingProposal(null);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={18} />
                  New Proposal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced proposal form */}
              {showProposalForm && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingProposal ? "Edit Proposal" : "Create New Community Proposal"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Proposal Title</label>
                      <input
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={proposalTitle}
                        onChange={e => setProposalTitle(e.target.value)}
                        placeholder="Enter a clear, descriptive title"
                        maxLength={80}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <textarea
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={proposalDesc}
                        onChange={e => setProposalDesc(e.target.value)}
                        placeholder="Provide a detailed description of your proposal, including rationale and expected impact"
                        rows={6}
                        maxLength={2000}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        disabled={!proposalTitle || !proposalDesc || createProposal.isPending || editProposal.isPending}
                        onClick={() => {
                          if (editingProposal) {
                            editProposal.mutate({ id: editingProposal.id, title: proposalTitle, description: proposalDesc });
                          } else {
                            createProposal.mutate({ title: proposalTitle, description: proposalDesc });
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
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
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {loadingProposals ? (
                  <Card className="border-dashed border-2 border-blue-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <List className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
                        <div className="text-lg font-medium text-muted-foreground">Loading proposals...</div>
                      </div>
                    </CardContent>
                  </Card>
                ) : proposals?.length === 0 ? (
                  <Card className="border-dashed border-2 border-blue-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Plus className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                        <div className="text-lg font-medium text-muted-foreground mb-2">No community proposals yet</div>
                        <p className="text-sm text-muted-foreground">Be the first to create a proposal for the community</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  proposals?.map((prop) => (
                    <Card key={prop.id} className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{prop.title}</CardTitle>
                            <div className="flex gap-3 items-center text-sm">
                              <span className="text-muted-foreground">Created by:</span>
                              <Badge variant={prop.createdBy === nodeId ? "default" : "outline"} className="font-medium">
                                {prop.createdBy === nodeId ? "You" : `${prop.createdBy.slice(0, 8)}...`}
                              </Badge>
                              <span className="text-muted-foreground">
                                on {(new Date(prop.createdAt)).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
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
                              className="flex items-center gap-2"
                            >
                              <Edit size={14} />
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced System Info Tab */}
        <TabsContent value="system-info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-green-600" />
                  CEO Agent Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Agent Status</span>
                  {stackStatus?.ceo ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <Activity className="h-3 w-3 mr-1" />
                      Active & Running
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <Activity className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>AI Model:</span>
                    <span className="font-medium">Ollama Integration</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proposal Generation:</span>
                    <span className="font-medium text-green-600">Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Analysis:</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Governance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{agenticHook.agentic.length}</div>
                    <div className="text-xs text-muted-foreground">AI Proposals</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{proposals?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Community Proposals</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Your Node ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{nodeId.slice(0, 12)}...</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Governance Role:</span>
                    <span className="font-medium">Validator Node</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional system info */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-600" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-base mb-3">Network Services</h4>
                  <div className="space-y-1">
                    <p>• Container Management: Available via Stack Manager</p>
                    <p>• AI Governance: Powered by Ollama AI Model</p>
                    <p>• Proposal System: Community & AI-driven</p>
                    <p>• Network Monitoring: Real-time status tracking</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-base mb-3">Integration Status</h4>
                  <div className="space-y-1">
                    <p>• CEO Agent: {stackStatus?.ceo ? 'Connected' : 'Disconnected'}</p>
                    <p>• Blockchain Network: {stackStatus?.mainnet ? 'Active' : 'Inactive'}</p>
                    <p>• Explorer Services: {stackStatus?.explorer ? 'Running' : 'Stopped'}</p>
                    <p>• Website Portal: {stackStatus?.website ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="mb-1">
                <strong>Note:</strong> Container management functions have been moved to the Stack Manager tab for better organization.
              </p>
              <p>
                For detailed container logs and system diagnostics, visit the <strong>Logs</strong> tab and select <strong>CEO Service</strong> (<code>afro-ceo</code>).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
