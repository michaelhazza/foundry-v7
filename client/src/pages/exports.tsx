/**
 * Exports page.
 */

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, FileText, Trash2, Clock } from 'lucide-react';

interface Export {
  id: number;
  runId: number;
  format: string;
  fileName: string;
  fileSize: number | null;
  recordCount: number | null;
  downloadCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function ExportsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: exports, isLoading } = useQuery({
    queryKey: ['project', id, 'exports'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Export[] }>(
        `/exports/projects/${id}/exports`
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (exportId: number) => {
      await apiClient.delete(`/exports/${exportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'exports'] });
    },
  });

  const handleDownload = (exportId: number, fileName: string) => {
    window.open(`/api/exports/${exportId}/download`, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exports</h1>
        <p className="text-muted-foreground">
          Download your processed datasets.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !exports?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exports yet</h3>
            <p className="text-muted-foreground">
              Process your data to generate exportable datasets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exports.map((exp) => (
            <Card key={exp.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{exp.fileName}</CardTitle>
                      <CardDescription>
                        From processing run #{exp.runId}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(exp.id, exp.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(exp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>Format: {exp.format.toUpperCase()}</span>
                  <span>Size: {formatFileSize(exp.fileSize)}</span>
                  <span>Records: {exp.recordCount?.toLocaleString() || '-'}</span>
                  <span>Downloads: {exp.downloadCount}</span>
                  {exp.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(exp.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
