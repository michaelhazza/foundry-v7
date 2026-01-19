/**
 * Organisation settings page.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Building, Loader2, CheckCircle } from 'lucide-react';

interface Organisation {
  id: number;
  name: string;
  createdAt: string;
}

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: org, isLoading } = useQuery({
    queryKey: ['organisation'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Organisation }>('/organisations/current');
      return response.data.data;
    },
    onSuccess: (data) => {
      setName(data.name);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiClient.patch('/organisations/current', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    if (name.trim()) {
      updateMutation.mutate({ name: name.trim() });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organisation Settings</h1>
        <p className="text-muted-foreground">
          Manage your organisation's details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisation Details
          </CardTitle>
          <CardDescription>
            Basic information about your organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organisation Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
            />
            {!isAdmin && (
              <p className="text-sm text-muted-foreground">
                Only administrators can change the organisation name.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Created</Label>
            <p className="text-sm text-muted-foreground">
              {org ? new Date(org.createdAt).toLocaleDateString() : '-'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || !name.trim()}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
