
import { useQuery } from "@tanstack/react-query";
import { ipcAPI } from "@/services/ipcAPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const SERVICES = [
    { id: 'afro-validator', name: 'Mainnet Validator' },
    { id: 'afro-testnet-validator', name: 'Testnet Validator' },
    { id: 'afro-explorer', name: 'Explorer' },
    { id: 'afro-ceo', name: 'CEO Service' },
    { id: 'afro-web', name: 'Web Server' },
];

const ServiceLogs = () => {
    const [selectedService, setSelectedService] = useState(SERVICES[0].id);

    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['serviceLogs', selectedService],
        queryFn: async () => {
          if (!selectedService) return ['Please select a service to view logs.'];
          const result = await ipcAPI.executeDockerCommand(`docker logs ${selectedService} --tail 100`);
          if (result.success) {
            return (result.data || '').split('\n').filter(Boolean);
          }
          return [`Failed to fetch logs for ${selectedService}: ${result.error || result.message}`];
        },
        refetchInterval: 5000,
        enabled: !!selectedService
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>System Logs</CardTitle>
                        <CardDescription>Recent activity from stack services</CardDescription>
                    </div>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                            {SERVICES.map(service => (
                                <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {isLoading && <div>Loading logs...</div>}
                    {error && <div>Error fetching logs: {(error as Error).message}</div>}
                    {logs && logs.length > 0 && (
                        <pre className="space-y-1 whitespace-pre-wrap">
                            {logs.map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </pre>
                    )}
                    {logs && logs.length === 0 && !isLoading && <div>No logs to display for this service.</div>}
                </div>
            </CardContent>
        </Card>
    );
};

export default ServiceLogs;
