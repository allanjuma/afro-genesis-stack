
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Info, Settings, List, Plus, Edit } from "lucide-react";
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

function getNodeId() {
  // Node ID can ultimately be fetched/derived as per node identity (stubbed here)
  // In practice, this should be a signature/public key (e.g., from wallet)
  let id = localStorage.getItem("ceo_node_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem("ceo_node_id", id);
  }
  return id;
}

export default function CeoAgentManager() {
  const [loadingOp, setLoadingOp] = useState<string | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDesc, setProposalDesc] = useState("");
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
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

  // UI for proposal list and creation form
  const ProposalSection = (
    <div>
      <div className="flex items-center gap-2 mt-4 mb-3">
        <List className="text-primary" size={20} />
        <span className="font-semibold">DAO Proposals</span>
        <Button size="sm" variant="outline" onClick={() => {
          setShowProposalForm(true);
          setEditingProposal(null);
        }}>
          <Plus size={14} /> New Proposal
        </Button>
      </div>
      {loadingProposals ? (
        <div className="text-xs text-muted-foreground">Loading proposals...</div>
      ) : (
        <div className="space-y-2">
          {proposals?.length === 0 && (
            <div className="text-xs text-muted-foreground">No proposals yet.</div>
          )}
          {proposals && proposals.map((prop) => (
            <Card key={prop.id} className="border-2 border-muted">
              <CardHeader className="p-2 pb-0">
                <CardTitle className="text-base">{prop.title}</CardTitle>
                <CardDescription className="flex gap-2 items-center">
                  <span>By: <Badge variant={prop.createdBy === nodeId ? "default" : "outline"}>
                    {prop.createdBy === nodeId ? "You" : prop.createdBy.slice(0, 6) + "..."}</Badge></span>
                  <span className="text-xs ml-2">{(new Date(prop.createdAt)).toLocaleString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="text-xs text-muted-foreground mb-2">{prop.description}</div>
                {prop.createdBy === nodeId && (
                  <Button size="sm" variant="ghost"
                    onClick={() => {
                      setEditingProposal(prop);
                      setProposalTitle(prop.title);
                      setProposalDesc(prop.description);
                      setShowProposalForm(true);
                    }}>
                    <Edit size={14} /> Edit
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Proposal Form */}
      {showProposalForm && (
        <div className="mt-4 border p-3 rounded-lg bg-background">
          <h3 className="font-semibold text-sm mb-1">
            {editingProposal ? "Edit Proposal" : "New Proposal"}
          </h3>
          <div className="flex flex-col gap-2">
            <input
              className="border rounded p-2 text-sm"
              value={proposalTitle}
              onChange={e => setProposalTitle(e.target.value)}
              placeholder="Proposal title"
              maxLength={80}
            />
            <textarea
              className="border rounded p-2 text-sm"
              value={proposalDesc}
              onChange={e => setProposalDesc(e.target.value)}
              placeholder="Describe your proposal"
              rows={3}
              maxLength={2000}
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                disabled={!proposalTitle || !proposalDesc ||
                    createProposal.isPending || editProposal.isPending}
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
                type="button"
                size="sm"
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
    </div>
  );

  // -------- Render ----------
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} /> CEO Agent Manager
        </CardTitle>
        <CardDescription>
          Manage and monitor the CEO Agent container directly from your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            <span>Status: </span>
            {isLoading ? (
              <Badge variant="secondary">Loading...</Badge>
            ) : stackStatus?.ceo ? (
              <Badge variant="default">Running</Badge>
            ) : (
              <Badge variant="destructive">Stopped</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => operate("start")}
              disabled={loadingOp === "start" || isPending || stackStatus?.ceo}
            >
              Start
            </Button>
            <Button
              variant="outline"
              onClick={() => operate("stop")}
              disabled={loadingOp === "stop" || isPending || !stackStatus?.ceo}
            >
              Stop
            </Button>
            <Button
              variant="secondary"
              onClick={() => operate("restart")}
              disabled={loadingOp === "restart" || isPending || !stackStatus?.ceo}
            >
              Restart
            </Button>
            <Button
              variant="ghost"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          {/* DAO: Proposal section */}
          {ProposalSection}

          <div className="mt-4 bg-muted p-3 rounded text-xs">
            <Terminal size={14} className="inline mr-2" />
            <span>
              Use these controls to manage CEO Agent container. For container logs, open the <b>Logs</b> tab and select <b>CEO Service</b> (<code>afro-ceo</code>).
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
