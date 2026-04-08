import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePriceWatch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watches = [] } = useQuery({
    queryKey: ['price-watches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('price_watches')
        .select('product_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(w => w.product_id);
    },
    enabled: !!user,
  });

  const addWatch = useMutation({
    mutationFn: async ({ productId, price }: { productId: string; price: number }) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('price_watches')
        .insert({ user_id: user.id, product_id: productId, watched_price: price });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watches'] });
      toast.success('Price watch added — we\'ll notify you on drops!');
    },
    onError: () => {
      toast.error('Failed to add price watch');
    },
  });

  const removeWatch = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('price_watches')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watches'] });
      toast.success('Price watch removed');
    },
  });

  const isWatching = (productId: string) => watches.includes(productId);

  const toggleWatch = (productId: string, currentPrice: number) => {
    if (isWatching(productId)) {
      removeWatch.mutate(productId);
    } else {
      addWatch.mutate({ productId, price: currentPrice });
    }
  };

  return { watches, isWatching, toggleWatch, isLoading: addWatch.isPending || removeWatch.isPending };
}
