
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Terminal, Play, RefreshCw, LogOut, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const COMMON_COMMANDS = [
  { label: "docker ps", command: "docker ps", icon: Terminal },
  { label: "docker-compose up -d", command: "docker-compose up -d", icon: Play },
  { label: "docker-compose down", command: "docker-compose down", icon: LogOut },
  { label: "docker-compose restart", command: "docker-compose restart", icon: RefreshCw },
  { label: "docker-compose logs -f", command: "docker-compose logs -f", icon: Zap },
];

const DockerCLI = () => {
  const [cmd, setCmd] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // Handler for running the command
  const runCommand = async (command?: string) => {
    const finalCmd = (command ?? cmd).trim();
    if (!finalCmd) {
      toast({ title: "No command specified", description: "Please enter a Docker or docker-compose command.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setOutput(""); // clear previous output
    try {
      // Talk to local backend via assumed endpoint
      const res = await fetch("/api/docker-cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: finalCmd }),
      });
      const data = await res.json();
      if (data?.output) setOutput(data.output);
      else setOutput("No response from backend. Is the AppImage running with CLI support?");
    } catch (err: any) {
      setOutput("Failed to execute command: " + String(err));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Textarea
          className="w-full font-mono resize-none"
          placeholder="Enter docker or docker-compose command…"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          minRows={2}
          maxRows={4}
          disabled={loading}
        />
        <Button onClick={() => runCommand()} disabled={loading || !cmd.trim()} className="h-10 shrink-0">
          <Terminal className="w-5 h-5 mr-2" />
          Run
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {COMMON_COMMANDS.map(({ label, command, icon: Icon }) => (
          <Button
            key={command}
            size="sm"
            variant="outline"
            onClick={() => { setCmd(command); runCommand(command); }}
            disabled={loading}
            type="button"
            className="flex items-center gap-1"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>
      <div className="rounded-lg bg-black text-green-400 font-mono p-4 min-h-32 max-h-96 overflow-y-auto transition-all relative">
        {loading ? (
          <span className="animate-pulse text-yellow-300">Running command…</span>
        ) : (
          <pre className="whitespace-pre-wrap break-words">{output || "Command output will appear here."}</pre>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        <b>Note:</b> This CLI controls the Docker stack on the host via backend integration, only available when running the Linux AppImage.<br/>
        You can run most <code>docker</code> and <code>docker-compose</code> commands here.
      </div>
    </div>
  );
};

export default DockerCLI;
