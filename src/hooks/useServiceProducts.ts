import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ServiceType } from '@/types/store';

export function useServiceProducts(serviceType: ServiceType, category?: string | null) {
  return useQuery({
    queryKey: ['products', serviceType, category],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('service_type', serviceType)
        .gt('inventory_count', 0)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useServiceCategories(serviceType: ServiceType) {
  return useQuery({
    queryKey: ['categories', serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .eq('service_type', serviceType)
        .gt('inventory_count', 0);

      if (error) throw error;
      const categories = [...new Set(data?.map(p => p.category).filter(Boolean))] as string[];
      return categories;
    },
  });
}
