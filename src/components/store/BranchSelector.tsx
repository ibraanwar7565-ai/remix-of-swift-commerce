import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useNearestBranch } from '@/hooks/useBranches';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Branch } from '@/hooks/useBranches';

interface BranchSelectorProps {
  userLat: number | null;
  userLng: number | null;
}

export function BranchSelector({ userLat, userLng }: BranchSelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: nearestData } = useNearestBranch(userLat, userLng);
  const { selectedBranch, selectBranch } = useUserBranch();

  // Fetch all active branches
  const { data: allBranches } = useQuery({
    queryKey: ['all-active-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Branch[];
    },
  });

  // Auto-select nearest branch if user has no selection yet
  useEffect(() => {
    if (user && nearestData && !selectedBranch && !selectBranch.isPending) {
      selectBranch.mutate(nearestData.branch.id);
    }
  }, [user, nearestData, selectedBranch]);

  if (!allBranches || allBranches.length === 0) return null;

  const currentBranchId = selectedBranch?.branch_id || nearestData?.branch?.id;
  const currentBranch = allBranches.find(b => b.id === currentBranchId) || allBranches[0];

  const handleSelect = (branchId: string) => {
    if (!user) return;
    selectBranch.mutate(branchId);
    setIsOpen(false);
  };

  return (
    <div className="mx-4 relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-xs text-muted-foreground">Delivering from</p>
            <p className="text-sm font-semibold truncate">{currentBranch.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentBranch.address_line}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {allBranches.map(branch => (
            <button
              key={branch.id}
              onClick={() => handleSelect(branch.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium">{branch.name}</p>
                <p className="text-xs text-muted-foreground truncate">{branch.address_line}, {branch.city}</p>
                <p className="text-xs text-muted-foreground">{branch.opening_time} – {branch.closing_time}</p>
              </div>
              {branch.id === currentBranchId && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
