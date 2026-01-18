/**
 * PII preview page.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Loader2, Shield } from 'lucide-react';

interface PiiPreview {
  original: Record<string, unknown>[];
  processed: Record<string, unknown>[];
  rules: number;
}

export default function PiiPreviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data: sources } = useQuery({
    queryKey: ['project', id, 'sources'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { id: number; name: string }[] }>(
        `/sources/projects/${id}/sources`
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/projects/${id}/configuration/pii`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">PII Preview</h1>
          <p className="text-muted-foreground">
            Preview how PII handling rules will affect your data.
          </p>
        </div>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            This feature will show a before/after comparison of your data with PII rules applied.
          </p>
          <Link to={`/projects/${id}/configuration/pii`}>
            <Button variant="outline">Back to PII Configuration</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
