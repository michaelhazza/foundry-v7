/**
 * Invitation acceptance page.
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Database, Loader2 } from 'lucide-react';

interface InvitationDetails {
  id: number;
  email: string;
  role: string;
  organisationName: string;
  expiresAt: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: invitation, isLoading, error: fetchError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const response = await apiClient.get<{ data: InvitationDetails }>(`/invitations/${token}`);
      return response.data.data;
    },
    enabled: !!token,
  });

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      await apiClient.post(`/invitations/${token}/accept`);
      setAccepted(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button className="w-full">Go to login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <CardTitle className="text-2xl font-bold">Invitation Accepted</CardTitle>
            <CardDescription>
              You have successfully joined {invitation.organisationName}.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/" className="w-full">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">You're invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation.organisationName}</strong> as a{' '}
            <strong>{invitation.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="text-center text-sm text-muted-foreground">
            Invited email: <strong>{invitation.email}</strong>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isAuthenticated ? (
            <Button onClick={handleAccept} className="w-full" disabled={accepting}>
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          ) : (
            <>
              <Link to={`/register?token=${token}`} className="w-full">
                <Button className="w-full">Create Account & Join</Button>
              </Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
                Already have an account? Sign in
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
