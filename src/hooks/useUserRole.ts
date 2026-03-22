import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'customer' | 'order_manager' | 'inventory_manager' | 'support' | 'rider';

interface UserRoleData {
  role: AppRole;
  branch_id: string | null;
}

export function useUserRole() {
  const { user } = useAuth();

  const { data: roleData, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [] as UserRoleData[];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, branch_id')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [] as UserRoleData[];
      }
      
      return (data ?? []) as UserRoleData[];
    },
    enabled: !!user,
  });

  const items = roleData ?? [];
  const roles = items.map(r => r.role);
  const adminRole = items.find(r => r.role === 'admin');

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isMainAdmin: !!adminRole && adminRole.branch_id === null,
    isBranchAdmin: !!adminRole && adminRole.branch_id !== null,
    branchId: adminRole?.branch_id ?? null,
    isRider: roles.includes('rider'),
    isLoading,
    isAuthenticated: !!user,
  };
}
