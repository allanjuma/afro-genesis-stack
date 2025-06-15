import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings, Save, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { stackAPI } from "@/services/stackAPI";

interface EndpointConfig {
  service: string;
  defaultEndpoint: string;
  customEndpoint: string;
  port: string;
  description: string;
  category: 'validator' | 'explorer' | 'database' | 'ai' | 'web';
}

const EndpointManager = () => {
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([
    {
      service: "Mainnet Validator RPC",
      defaultEndpoint: "http://afro-validator:8545",
      customEndpoint: "",
      port: "8545",
      description: "JSON-RPC endpoint for mainnet validator",
      category: "validator"
    },
    {
      service: "Mainnet Validator P2P",
      defaultEndpoint: "afro-validator:30303",
      customEndpoint: "",
      port: "30303",
      description: "P2P network endpoint for peer connections",
      category: "validator"
    },
    {
      service: "Testnet Validator RPC",
      defaultEndpoint: "http://afro-testnet-validator:8547",
      customEndpoint: "",
      port: "8547",
      description: "JSON-RPC endpoint for testnet validator",
      category: "validator"
    },
    {
      service: "Testnet Validator P2P",
      defaultEndpoint: "afro-testnet-validator:30304",
      customEndpoint: "",
      port: "30304",
      description: "P2P network endpoint for testnet peer connections",
      category: "validator"
    },
    {
      service: "Mainnet Explorer",
      defaultEndpoint: "http://afro-explorer:4000",
      customEndpoint: "",
      port: "4000",
      description: "Block explorer web interface for mainnet",
      category: "explorer"
    },
    {
      service: "Testnet Explorer",
      defaultEndpoint: "http://afro-testnet-explorer:4001",
      customEndpoint: "",
      port: "4001",
      description: "Block explorer web interface for testnet",
      category: "explorer"
    },
    {
      service: "Mainnet Database",
      defaultEndpoint: "postgresql://blockscout:blockscout_password@afro-db:5432/blockscout",
      customEndpoint: "",
      port: "5432",
      description: "PostgreSQL database for mainnet explorer",
      category: "database"
    },
    {
      service: "Testnet Database",
      defaultEndpoint: "postgresql://blockscout:blockscout_testnet_password@afro-testnet-db:5432/blockscout",
      customEndpoint: "",
      port: "5432",
      description: "PostgreSQL database for testnet explorer",
      category: "database"
    },
    {
      service: "CEO Agent API",
      defaultEndpoint: "http://afro-ceo:3000",
      customEndpoint: "",
      port: "3000",
      description: "CEO management agent API endpoint",
      category: "ai"
    },
    {
      service: "Ollama API",
      defaultEndpoint: "http://localhost:11434",
      customEndpoint: "",
      port: "11434",
      description: "Ollama AI model API for CEO agent",
      category: "ai"
    },
    {
      service: "Web Frontend",
      defaultEndpoint: "http://afro-web:80",
      customEndpoint: "",
      port: "80",
      description: "Main web frontend interface",
      category: "web"
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleEndpointChange = (index: number, value: string) => {
    const updated = [...endpoints];
    updated[index].customEndpoint = value;
    setEndpoints(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save via API and apply changes
      const resp = await stackAPI.saveEndpointConfig(endpoints);

      if (resp.success) {
        toast.success("Endpoints saved and services updated.");
        // If backend returns which services were restarted, show them
        if (resp.restarted && Array.isArray(resp.restarted) && resp.restarted.length > 0) {
          toast.success("Restarted: " + resp.restarted.join(", "));
        }
      } else {
        toast.error("Failed to save endpoints: " + (resp.message || ""));
      }
    } catch (error) {
      toast.error("Failed to save endpoint configurations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = (index: number) => {
    const updated = [...endpoints];
    updated[index].customEndpoint = "";
    setEndpoints(updated);
    toast.success("Endpoint reset to default");
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'validator': return 'bg-blue-100 text-blue-800';
      case 'explorer': return 'bg-green-100 text-green-800';
      case 'database': return 'bg-purple-100 text-purple-800';
      case 'ai': return 'bg-orange-100 text-orange-800';
      case 'web': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, EndpointConfig[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Endpoint Configuration</CardTitle>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save All"}
          </Button>
        </div>
        <CardDescription>
          Configure custom endpoints for each service. Leave empty to use default container addresses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
          <Collapsible
            key={category}
            open={openSections[category]}
            onOpenChange={() => toggleSection(category)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(category)}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryEndpoints.length} service{categoryEndpoints.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {openSections[category] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid gap-4">
                {categoryEndpoints.map((endpoint, categoryIndex) => {
                  const globalIndex = endpoints.findIndex(e => e === endpoint);
                  return (
                    <div key={globalIndex} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">{endpoint.service}</Label>
                          <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                        </div>
                        <Badge variant="outline">Port {endpoint.port}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Default Endpoint:</Label>
                        <div className="p-2 bg-muted rounded text-sm font-mono">
                          {endpoint.defaultEndpoint}
                        </div>
                        
                        <Label className="text-xs text-muted-foreground">Custom Endpoint (optional):</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder={`e.g., http://10.144.93.33:${endpoint.port} or afro-mainnet.bitsoko.org`}
                            value={endpoint.customEndpoint}
                            onChange={(e) => handleEndpointChange(globalIndex, e.target.value)}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReset(globalIndex)}
                            disabled={!endpoint.customEndpoint}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
            
            {category !== Object.keys(groupedEndpoints)[Object.keys(groupedEndpoints).length - 1] && (
              <Separator className="mt-4" />
            )}
          </Collapsible>
        ))}
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Configuration Notes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• External IPs: Use for connecting from outside the Docker network</li>
            <li>• Domain names: Use for public peer connections (e.g., afro-mainnet.bitsoko.org)</li>
            <li>• Local IPs: Use for connecting from other containers on the same host</li>
            <li>• Changes require container restart to take effect</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EndpointManager;
