import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RiderGuardProps {
  children: ReactNode;
}

export function RiderGuard({ children }: RiderGuardProps) {
  const { isRider, isLoading } = useUserRole();
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

  if (!isRider) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
