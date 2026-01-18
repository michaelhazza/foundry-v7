/**
 * PII configuration page.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield, Eye, Loader2, AlertTriangle } from 'lucide-react';

interface Source {
  id: number;
  name: string;
}

interface PiiRule {
  id: number;
  sourceFieldId: number;
  piiType: string;
  handling: string;
  confidence: number;
  isAutoDetected: boolean;
  fieldName: string;
}

export default function PiiConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['project', id, 'sources'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Source[] }>(`/sources/projects/${id}/sources`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const handleDetectPii = async (sourceId: number) => {
    await apiClient.post(`/configuration/sources/${sourceId}/pii/detect`);
    queryClient.invalidateQueries({ queryKey: ['pii-rules'] });
  };

  const handlingOptions = [
    { value: 'mask', label: 'Mask (partial hide)' },
    { value: 'redact', label: 'Redact (full removal)' },
    { value: 'hash', label: 'Hash (pseudonymize)' },
    { value: 'keep', label: 'Keep (no change)' },
  ];

  if (sourcesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${id}/configuration`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">PII Detection</h1>
          <p className="text-muted-foreground">
            Configure personal data detection and handling rules.
          </p>
        </div>
        <Link to={`/projects/${id}/configuration/pii/preview`}>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
        </Link>
      </div>

      {!sources?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Add data sources to configure PII detection.
            </p>
            <Link to={`/projects/${id}/sources`}>
              <Button>Add Sources</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <SourcePiiCard
              key={source.id}
              source={source}
              projectId={id!}
              onDetect={() => handleDetectPii(source.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SourcePiiCard({
  source,
  projectId,
  onDetect,
}: {
  source: Source;
  projectId: string;
  onDetect: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['pii-rules', source.id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PiiRule[] }>(
        `/configuration/sources/${source.id}/pii/rules`
      );
      return response.data.data;
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, handling }: { ruleId: number; handling: string }) => {
      await apiClient.patch(`/configuration/pii/rules/${ruleId}`, { handling });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pii-rules', source.id] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{source.name}</CardTitle>
            <CardDescription>
              {rules?.length || 0} PII fields detected
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onDetect}>
            <Shield className="h-4 w-4 mr-2" />
            Detect PII
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rules?.length ? (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <div>
                    <div className="font-medium">{rule.fieldName}</div>
                    <div className="text-sm text-muted-foreground">
                      {rule.piiType} ({rule.confidence}% confidence)
                    </div>
                  </div>
                </div>
                <Select
                  value={rule.handling}
                  onValueChange={(value) =>
                    updateRuleMutation.mutate({ ruleId: rule.id, handling: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mask">Mask</SelectItem>
                    <SelectItem value="redact">Redact</SelectItem>
                    <SelectItem value="hash">Hash</SelectItem>
                    <SelectItem value="keep">Keep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No PII detected. Click "Detect PII" to scan this source.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
