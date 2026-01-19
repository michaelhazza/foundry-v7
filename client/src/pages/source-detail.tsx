/**
 * Source detail page.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, FileText, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface Source {
  id: number;
  name: string;
  type: 'file' | 'api';
  status: string;
  fileType?: string;
  fileSize?: number;
  connectorType?: string;
  recordCount?: number;
  errorMessage?: string;
  createdAt: string;
}

interface SourceField {
  id: number;
  name: string;
  path: string;
  dataType: string;
  sampleValues: unknown[];
  nullCount: number;
  uniqueCount: number;
}

export default function SourceDetailPage() {
  const { id, sourceId } = useParams<{ id: string; sourceId: string }>();

  const { data: source, isLoading } = useQuery({
    queryKey: ['source', sourceId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Source }>(`/sources/${sourceId}`);
      return response.data.data;
    },
    enabled: !!sourceId,
  });

  const { data: fields } = useQuery({
    queryKey: ['source', sourceId, 'fields'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SourceField[] }>(`/sources/${sourceId}/fields`);
      return response.data.data;
    },
    enabled: !!sourceId && source?.status === 'ready',
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!source) {
    return <div>Source not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${id}/sources`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{source.name}</h1>
          <p className="text-muted-foreground">
            {source.type === 'file' ? source.fileType?.toUpperCase() : source.connectorType}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {source.status === 'ready' && <CheckCircle className="h-4 w-4 text-success" />}
              {source.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
              <span className="capitalize">{source.status}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {source.recordCount?.toLocaleString() || '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fields?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              File Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {source.fileSize
                ? `${(source.fileSize / 1024 / 1024).toFixed(2)} MB`
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {source.status === 'error' && source.errorMessage && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{source.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="pii">PII Detection</TabsTrigger>
        </TabsList>
        <TabsContent value="fields" className="mt-4">
          {fields?.length ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Field Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Unique Values</th>
                      <th className="text-left p-4 font-medium">Null Count</th>
                      <th className="text-left p-4 font-medium">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field) => (
                      <tr key={field.id} className="border-b last:border-0">
                        <td className="p-4 font-mono text-sm">{field.name}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-muted rounded text-sm">
                            {field.dataType}
                          </span>
                        </td>
                        <td className="p-4">{field.uniqueCount}</td>
                        <td className="p-4">{field.nullCount}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {field.sampleValues?.slice(0, 3).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No fields detected yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Data preview coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pii" className="mt-4">
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                <Link to={`/projects/${id}/configuration/pii`} className="text-primary hover:underline">
                  Configure PII detection
                </Link>
                {' '}for this source.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
