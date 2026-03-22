import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  allowRoles?: string[];
}

export function AdminGuard({ children, allowRoles }: AdminGuardProps) {
  const { isAdmin, roles, isLoading } = useUserRole();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has any of the allowed roles, or is admin (admins always pass)
  const hasAccess = isAdmin || (allowRoles && allowRoles.some(r => roles.includes(r as any)));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
