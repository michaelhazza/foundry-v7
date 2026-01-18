/**
 * Field mapping page.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from 'lucide-react';

interface Mapping {
  id: number;
  sourceFieldId: number;
  targetField: string;
  sourceFieldName: string;
  sourceFieldPath: string;
  sourceFieldDataType: string;
  isActive: boolean;
}

interface SchemaDefinition {
  targetSchema: string | null;
  schemaDefinition: {
    name: string;
    fields: Array<{ name: string; type: string; required?: boolean }>;
  } | null;
}

export default function FieldMappingPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: mappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['project', id, 'mappings'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Mapping[] }>(`/configuration/projects/${id}/mappings`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: schema } = useQuery({
    queryKey: ['project', id, 'schema'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SchemaDefinition }>(`/configuration/projects/${id}/schema`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: number) => {
      await apiClient.delete(`/configuration/mappings/${mappingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'mappings'] });
    },
  });

  if (mappingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const targetFields = schema?.schemaDefinition?.fields || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${id}/configuration`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Field Mapping</h1>
          <p className="text-muted-foreground">
            Map source fields to target schema fields.
          </p>
        </div>
      </div>

      {!schema?.targetSchema ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please select a target schema first.
            </p>
            <Link to={`/projects/${id}/configuration`}>
              <Button>Select Schema</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current Mappings</CardTitle>
              <CardDescription>
                Target Schema: {schema.schemaDefinition?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mappings?.length ? (
                <div className="space-y-4">
                  {mappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{mapping.sourceFieldName}</div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.sourceFieldDataType}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{mapping.targetField}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMappingMutation.mutate(mapping.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No mappings configured. Add source data and create mappings.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Schema Fields</CardTitle>
              <CardDescription>
                These fields are required for the {schema.schemaDefinition?.name} format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {targetFields.map((field) => {
                  const isMapped = mappings?.some(m => m.targetField === field.name);
                  return (
                    <div
                      key={field.name}
                      className={`p-4 rounded-lg border ${
                        isMapped ? 'border-success bg-success/5' : 'border-muted'
                      }`}
                    >
                      <div className="font-medium">{field.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {field.type} {field.required && '(required)'}
                      </div>
                      <div className="mt-2 text-sm">
                        {isMapped ? (
                          <span className="text-success">Mapped</span>
                        ) : (
                          <span className="text-muted-foreground">Not mapped</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
