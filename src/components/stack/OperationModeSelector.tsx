
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Settings } from "lucide-react";

interface OperationMode {
  id: string;
  name: string;
  description: string;
  services: string[];
}

interface OperationModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

const operationModes: OperationMode[] = [
  {
    id: 'production',
    name: 'Production',
    description: 'Full mainnet with explorer and website',
    services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-web', 'ceo']
  },
  {
    id: 'testnet',
    name: 'Testnet Only',
    description: 'Testnet validator with explorer for development',
    services: ['afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer']
  },
  {
    id: 'dual',
    name: 'Dual Network',
    description: 'Both mainnet and testnet running simultaneously',
    services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer']
  },
  {
    id: 'website',
    name: 'Website Only',
    description: 'Static website without blockchain services',
    services: ['afro-web']
  },
  {
    id: 'development',
    name: 'Development',
    description: 'All services for local development',
    services: ['afro-validator', 'afro-db', 'afro-explorer', 'afro-testnet-validator', 'afro-testnet-db', 'afro-testnet-explorer', 'afro-web', 'ceo']
  }
];

const OperationModeSelector = ({ selectedMode, onModeChange }: OperationModeSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Operation Mode
        </CardTitle>
        <CardDescription>
          Select the configuration mode for your Afro Network stack
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleGroup type="single" value={selectedMode} onValueChange={onModeChange}>
          {operationModes.map((mode) => (
            <ToggleGroupItem key={mode.id} value={mode.id} className="flex-col h-auto p-4">
              <div className="font-medium">{mode.name}</div>
              <div className="text-xs text-muted-foreground text-center">{mode.description}</div>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        
        <div className="text-sm text-muted-foreground">
          <strong>Selected services:</strong> {operationModes.find(m => m.id === selectedMode)?.services.join(', ')}
        </div>
      </CardContent>
    </Card>
  );
};

export { operationModes };
export default OperationModeSelector;
