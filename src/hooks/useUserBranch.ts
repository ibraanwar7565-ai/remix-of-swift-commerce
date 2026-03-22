import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useUserBranch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: selectedBranch, isLoading } = useQuery({
    queryKey: ['user-selected-branch', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_selected_branches')
        .select('*, branches(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const selectBranch = useMutation({
    mutationFn: async (branchId: string) => {
      if (!user) throw new Error('Not authenticated');
      // Upsert: insert or update
      const { error } = await supabase
        .from('user_selected_branches')
        .upsert(
          { user_id: user.id, branch_id: branchId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selected-branch'] });
      toast.success('Branch saved!');
    },
    onError: (e) => toast.error(`Failed to save branch: ${e.message}`),
  });

  return {
    selectedBranch,
    isLoading,
    selectBranch,
  };
}

// Admin hook: view all customer branch selections
export function useCustomerBranchSelections() {
  return useQuery({
    queryKey: ['customer-branch-selections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_selected_branches')
        .select('*, branches(name, address_line, city)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
