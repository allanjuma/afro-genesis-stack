
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ValidatorEditableSettingsProps {
  settings: {
    nodeId: string;
    validatorPhone: string;
  };
  onSave: (updated: { nodeId: string; validatorPhone: string }) => Promise<void>;
}

const ValidatorEditableSettings: React.FC<ValidatorEditableSettingsProps> = ({ settings, onSave }) => {
  const [nodeId, setNodeId] = useState(settings.nodeId);
  const [validatorPhone, setValidatorPhone] = useState(settings.validatorPhone);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({ nodeId, validatorPhone });
      toast({
        title: "Settings Saved",
        description: "Validator settings updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Save Failed",
        description: e.message || "Could not update validator settings.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Node ID</label>
        <Input
          value={nodeId}
          onChange={e => setNodeId(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Validator Phone</label>
        <Input
          value={validatorPhone}
          onChange={e => setValidatorPhone(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default ValidatorEditableSettings;
