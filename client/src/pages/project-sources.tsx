/**
 * Project sources page.
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Plug, FileText, Database, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Source {
  id: number;
  name: string;
  type: 'file' | 'api';
  status: string;
  fileType?: string;
  connectorType?: string;
  recordCount?: number;
  createdAt: string;
}

export default function ProjectSourcesPage() {
  const { id } = useParams<{ id: string }>();

  const { data: sources, isLoading } = useQuery({
    queryKey: ['project', id, 'sources'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Source[] }>(`/sources/projects/${id}/sources`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-info animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage your project's data sources
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/sources/new/upload`}>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </Link>
          <Link to={`/projects/${id}/sources/new/api`}>
            <Button variant="outline">
              <Plug className="h-4 w-4 mr-2" />
              Connect API
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !sources?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data sources</h3>
            <p className="text-muted-foreground mb-4">
              Add data sources to start preparing your data.
            </p>
            <div className="flex gap-2 justify-center">
              <Link to={`/projects/${id}/sources/new/upload`}>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </Link>
              <Link to={`/projects/${id}/sources/new/api`}>
                <Button variant="outline">
                  <Plug className="h-4 w-4 mr-2" />
                  Connect API
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sources.map((source) => (
            <Link key={source.id} to={`/projects/${id}/sources/${source.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {source.type === 'file' ? (
                        <FileText className="h-8 w-8 text-primary" />
                      ) : (
                        <Plug className="h-8 w-8 text-primary" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <CardDescription>
                          {source.type === 'file' ? source.fileType?.toUpperCase() : source.connectorType}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {source.recordCount !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {source.recordCount.toLocaleString()} records
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {statusIcon(source.status)}
                        <span className="text-sm capitalize">{source.status}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
