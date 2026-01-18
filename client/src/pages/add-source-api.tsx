/**
 * Add source - API connector page.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plug, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AddSourceApiPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [connectorType, setConnectorType] = useState<string>('teamwork');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/sources/test-connector', {
        connectorType,
        connectorConfig: {
          apiKey,
          baseUrl,
        },
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: () => {
      setTestResult({ success: false, message: 'Connection failed' });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/sources/projects/${id}/sources/api`, {
        name,
        connectorType,
        connectorConfig: {
          apiKey,
          baseUrl,
        },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'sources'] });
      navigate(`/projects/${id}/sources`);
    },
  });

  const connectors = [
    {
      id: 'teamwork',
      name: 'Teamwork',
      description: 'Connect to Teamwork Desk for support ticket data',
    },
    {
      id: 'gohighlevel',
      name: 'GoHighLevel',
      description: 'Connect to GoHighLevel CRM for customer data',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect API Source</h1>
        <p className="text-muted-foreground">
          Connect to an external API to import data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Connector</CardTitle>
          <CardDescription>
            Choose the API connector you want to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={connectorType}
            onValueChange={setConnectorType}
            className="grid gap-4"
          >
            {connectors.map((connector) => (
              <div key={connector.id}>
                <RadioGroupItem
                  value={connector.id}
                  id={connector.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={connector.id}
                  className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <Plug className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{connector.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {connector.description}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            Enter your API credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Source Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Source"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL (optional)</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 text-sm rounded-md ${
              testResult.success
                ? 'text-success bg-success/10'
                : 'text-destructive bg-destructive/10'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !apiKey}
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !name || !apiKey}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Create Source'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
