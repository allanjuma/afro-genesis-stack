
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Info, Settings } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

type CeoStackStatus = {
  mainnet: boolean;
  testnet: boolean;
  explorer: boolean;
  website: boolean;
  ceo: boolean;
};

export default function CeoAgentManager() {
  const [loadingOp, setLoadingOp] = useState<string | null>(null);

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
              onClick={refetch}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
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
