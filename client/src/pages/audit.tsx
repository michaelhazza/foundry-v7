/**
 * Audit page.
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, GitBranch, Shield, Loader2 } from 'lucide-react';

interface AuditEvent {
  id: number;
  eventType: string;
  eventData: Record<string, unknown>;
  resourceType: string | null;
  resourceId: number | null;
  createdAt: string;
  userName: string | null;
}

interface Lineage {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
}

interface PiiSummary {
  totalRules: number;
  byType: Array<{ type: string; count: number }>;
  byHandling: Array<{ handling: string; count: number }>;
}

export default function AuditPage() {
  const { id } = useParams<{ id: string }>();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['project', id, 'audit-events'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AuditEvent[] }>(
        `/audit/projects/${id}/audit/events`
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: lineage } = useQuery({
    queryKey: ['project', id, 'lineage'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Lineage }>(
        `/audit/projects/${id}/audit/lineage`
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: piiSummary } = useQuery({
    queryKey: ['project', id, 'pii-summary'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PiiSummary }>(
        `/audit/projects/${id}/audit/pii-summary`
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit & Lineage</h1>
        <p className="text-muted-foreground">
          Track activity, data lineage, and PII handling.
        </p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            <History className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="lineage">
            <GitBranch className="h-4 w-4 mr-2" />
            Data Lineage
          </TabsTrigger>
          <TabsTrigger value="pii">
            <Shield className="h-4 w-4 mr-2" />
            PII Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent activity in this project</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : events?.length ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{event.eventType}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.userName || 'System'} •{' '}
                          {new Date(event.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Lineage</CardTitle>
              <CardDescription>
                Track how data flows through your processing pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lineage?.nodes.length ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="font-medium mb-2">Sources</div>
                      {lineage.nodes
                        .filter((n) => n.type === 'source')
                        .map((node) => (
                          <div key={node.id} className="text-sm">
                            {node.label}
                          </div>
                        ))}
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="font-medium mb-2">Processing Runs</div>
                      {lineage.nodes
                        .filter((n) => n.type === 'processing')
                        .map((node) => (
                          <div key={node.id} className="text-sm">
                            {node.label}
                          </div>
                        ))}
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="font-medium mb-2">Exports</div>
                      {lineage.nodes
                        .filter((n) => n.type === 'export')
                        .map((node) => (
                          <div key={node.id} className="text-sm">
                            {node.label}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No lineage data available. Add sources and run processing.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pii" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>PII Summary</CardTitle>
              <CardDescription>
                Overview of personal data handling in this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {piiSummary?.totalRules ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="font-medium">By PII Type</div>
                    {piiSummary.byType.map((item) => (
                      <div
                        key={item.type}
                        className="flex justify-between text-sm p-2 bg-muted rounded"
                      >
                        <span className="capitalize">{item.type}</span>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">By Handling Method</div>
                    {piiSummary.byHandling.map((item) => (
                      <div
                        key={item.handling}
                        className="flex justify-between text-sm p-2 bg-muted rounded"
                      >
                        <span className="capitalize">{item.handling}</span>
                        <span>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No PII rules configured. Configure PII detection for your sources.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
