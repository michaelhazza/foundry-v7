/**
 * Role-based route protection component.
 * Wraps protected routes and checks authentication/authorization.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, User } from '@/hooks/use-auth';

interface RequireRoleProps {
  children?: React.ReactNode;
  allowedRoles?: Array<'admin' | 'member'>;
}

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if roles are specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default RequireRole;
