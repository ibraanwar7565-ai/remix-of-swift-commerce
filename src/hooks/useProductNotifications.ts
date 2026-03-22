import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useProductNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscriptions } = useQuery({
    queryKey: ['product-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('product_notifications')
        .select('product_id')
        .eq('user_id', user.id)
        .eq('notified', false);
      if (error) throw error;
      return data?.map(n => n.product_id) || [];
    },
    enabled: !!user,
  });

  const subscribe = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('product_notifications')
        .insert({
          user_id: user.id,
          product_id: productId,
          email: user.email!,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-notifications'] });
      toast.success("We'll email you when it's back in stock!");
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.info("You're already subscribed for this product");
      } else {
        toast.error('Failed to subscribe');
      }
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('product_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-notifications'] });
      toast.success('Notification removed');
    },
  });

  return {
    subscriptions: subscriptions || [],
    isSubscribed: (productId: string) => subscriptions?.includes(productId) || false,
    subscribe: subscribe.mutate,
    unsubscribe: unsubscribe.mutate,
    isLoading: subscribe.isPending || unsubscribe.isPending,
  };
}
