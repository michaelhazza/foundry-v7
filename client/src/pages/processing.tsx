/**
 * Processing page.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Loader2, CheckCircle, XCircle, Clock, Settings, History } from 'lucide-react';

interface ProcessingRun {
  id: number;
  status: string;
  totalRecords: number;
  processedRecords: number;
  filteredRecords: number;
  errorRecords: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: runs, isLoading } = useQuery({
    queryKey: ['project', id, 'processing-runs'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ProcessingRun[] }>(
        `/processing/projects/${id}/processing/runs`
      );
      return response.data.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.some(run => run.status === 'processing')) {
        return 2000;
      }
      return false;
    },
  });

  const startProcessingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/processing/projects/${id}/processing/start`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id, 'processing-runs'] });
    },
  });

  const currentRun = runs?.find(r => r.status === 'processing');
  const completedRuns = runs?.filter(r => r.status !== 'processing') || [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-info animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Processing</h1>
          <p className="text-muted-foreground">
            Transform your data and generate AI-ready datasets.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/processing/quality`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Quality Settings
            </Button>
          </Link>
          <Button
            onClick={() => startProcessingMutation.mutate()}
            disabled={startProcessingMutation.isPending || !!currentRun}
          >
            {startProcessingMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </>
            )}
          </Button>
        </div>
      </div>

      {currentRun && (
        <Card className="border-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-info animate-spin" />
              Processing in Progress
            </CardTitle>
            <CardDescription>Run #{currentRun.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {currentRun.processedRecords.toLocaleString()} / {currentRun.totalRecords.toLocaleString()} records
                </span>
              </div>
              <Progress
                value={
                  currentRun.totalRecords > 0
                    ? (currentRun.processedRecords / currentRun.totalRecords) * 100
                    : 0
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Processing History
          </CardTitle>
          <CardDescription>Previous processing runs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : completedRuns.length ? (
            <div className="space-y-3">
              {completedRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(run.status)}
                    <div>
                      <div className="font-medium">Run #{run.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium capitalize">{run.status}</div>
                    <div className="text-sm text-muted-foreground">
                      {run.processedRecords.toLocaleString()} records
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No processing runs yet. Click "Start Processing" to begin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
