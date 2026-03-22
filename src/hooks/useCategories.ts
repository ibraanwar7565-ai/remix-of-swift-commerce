import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .gt('inventory_count', 0);

      if (error) throw error;

      // Extract unique categories
      const categories = [...new Set(
        (data || [])
          .map(p => p.category)
          .filter(Boolean)
      )] as string[];

      return categories;
    },
  });
}
