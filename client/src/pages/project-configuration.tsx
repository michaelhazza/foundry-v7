/**
 * Project configuration page.
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Settings, Map, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface SchemaDefinition {
  id: string;
  name: string;
  fields: Array<{ name: string; type: string; required?: boolean }>;
}

interface ProjectSchema {
  targetSchema: string | null;
  availableSchemas: SchemaDefinition[];
}

export default function ProjectConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: schema, isLoading } = useQuery({
    queryKey: ['project', id, 'schema'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ProjectSchema }>(`/configuration/projects/${id}/schema`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const updateSchemaMutation = useMutation({
    mutationFn: async (targetSchema: string) => {
      const response = await apiClient.patch(`/configuration/projects/${id}/schema`, { targetSchema });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'schema'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">
          Configure your data transformation settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to={`/projects/${id}/configuration/mapping`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <Map className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                Map source fields to target schema fields.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-primary text-sm">
                Configure mappings
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${id}/configuration/pii`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>PII Detection</CardTitle>
              <CardDescription>
                Configure personal data detection and handling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-primary text-sm">
                Configure PII rules
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Schema</CardTitle>
          <CardDescription>
            Select the output format for your transformed data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={schema?.targetSchema || ''}
            onValueChange={(value) => updateSchemaMutation.mutate(value)}
            className="grid gap-4 md:grid-cols-2"
          >
            {schema?.availableSchemas.map((s) => (
              <div key={s.id}>
                <RadioGroupItem
                  value={s.id}
                  id={s.id}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={s.id}
                  className="flex flex-col p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{s.name}</span>
                    {schema?.targetSchema === s.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fields: {s.fields.map(f => f.name).join(', ')}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
