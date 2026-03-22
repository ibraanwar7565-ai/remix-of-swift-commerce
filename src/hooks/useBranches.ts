import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Branch {
  id: string;
  name: string;
  address_line: string;
  city: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  opening_time: string | null;
  closing_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBranches() {
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Branch[];
    },
  });

  const createBranch = useMutation({
    mutationFn: async (branch: Omit<Branch, 'id' | 'created_at' | 'updated_at' | 'latitude' | 'longitude'> & { latitude?: number; longitude?: number }) => {
      const { data, error } = await supabase
        .from('branches')
        .insert(branch)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created successfully');
    },
    onError: (e) => toast.error(`Failed to create branch: ${e.message}`),
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Branch> & { id: string }) => {
      const { error } = await supabase
        .from('branches')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch updated');
    },
    onError: (e) => toast.error(`Failed to update: ${e.message}`),
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
    },
    onError: (e) => toast.error(`Failed to delete: ${e.message}`),
  });

  return { branches: branches || [], isLoading, createBranch, updateBranch, deleteBranch };
}

export function useNearestBranch(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearest-branch', lat, lng],
    queryFn: async () => {
      if (lat === null || lng === null) return null;
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Haversine distance
      const toRad = (d: number) => (d * Math.PI) / 180;
      let nearest = data[0];
      let minDist = Infinity;
      for (const b of data) {
        const dLat = toRad(b.latitude - lat);
        const dLng = toRad(b.longitude - lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
        const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
        if (dist < minDist) {
          minDist = dist;
          nearest = b;
        }
      }
      return { branch: nearest as Branch, distanceKm: Math.round(minDist * 10) / 10 };
    },
    enabled: lat !== null && lng !== null,
  });
}
