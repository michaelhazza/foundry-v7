/**
 * Project overview page.
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileText, Settings, Play, Download, History, ArrowRight, Loader2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  targetSchema: string | null;
}

interface ProjectStats {
  sourceCount: number;
  totalRecords: number;
  runCount: number;
  exportCount: number;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Project }>(`/projects/${id}`);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['project', id, 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ProjectStats }>(`/projects/${id}/stats`);
      return response.data.data;
    },
    enabled: !!id,
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const quickActions = [
    {
      title: 'Data Sources',
      description: 'Upload files or connect APIs',
      icon: Database,
      href: `/projects/${id}/sources`,
      count: stats?.sourceCount,
    },
    {
      title: 'Configuration',
      description: 'Set up schema and mappings',
      icon: Settings,
      href: `/projects/${id}/configuration`,
    },
    {
      title: 'Processing',
      description: 'Run data transformation',
      icon: Play,
      href: `/projects/${id}/processing`,
      count: stats?.runCount,
    },
    {
      title: 'Exports',
      description: 'Download processed data',
      icon: Download,
      href: `/projects/${id}/exports`,
      count: stats?.exportCount,
    },
    {
      title: 'Audit Log',
      description: 'View activity and lineage',
      icon: History,
      href: `/projects/${id}/audit`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-2 py-1 text-sm rounded-full ${
              project.status === 'completed' ? 'bg-success/10 text-success' :
              project.status === 'processing' ? 'bg-info/10 text-info' :
              project.status === 'configured' ? 'bg-warning/10 text-warning' :
              'bg-muted text-muted-foreground'
            }`}>
              {project.status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sourceCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRecords?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {project.targetSchema || 'Not configured'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <action.icon className="h-8 w-8 text-primary" />
                  {action.count !== undefined && (
                    <span className="text-2xl font-bold">{action.count}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
                <div className="flex items-center text-primary text-sm mt-4">
                  Go to {action.title.toLowerCase()}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
