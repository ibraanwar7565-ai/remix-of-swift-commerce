import { useState, useMemo } from 'react';
import { Plus, Search, UserPlus, Bike, ShieldCheck, Package, Headphones, User, ArrowLeft, Store, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { useBranches } from '@/hooks/useBranches';
import { toast } from 'sonner';

type AppRole = 'admin' | 'order_manager' | 'inventory_manager' | 'support' | 'rider' | 'customer';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  branch_id: string | null;
  created_at: string;
}

const roleConfig: Record<AppRole, { icon: typeof User; label: string; color: string }> = {
  admin: { icon: ShieldCheck, label: 'Admin', color: 'bg-primary/10 text-primary' },
  order_manager: { icon: Package, label: 'Order Manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  inventory_manager: { icon: Package, label: 'Inventory', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  support: { icon: Headphones, label: 'Support', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  rider: { icon: Bike, label: 'Rider', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  customer: { icon: User, label: 'Customer', color: 'bg-muted text-muted-foreground' },
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<AppRole | 'all'>('all');
  const { branches } = useBranches();
  const branchMap = useMemo(() => new Map(branches.map(b => [b.id, b.name])), [branches]);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, user_id, full_name, phone, created_at'),
        supabase.from('user_roles').select('user_id, role, branch_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, { role: r.role, branch_id: r.branch_id }]) || []);

      return (profilesRes.data || []).map(profile => {
        const roleInfo = roleMap.get(profile.user_id);
        return {
          id: profile.user_id,
          email: '',
          full_name: profile.full_name,
          phone: profile.phone,
          role: (roleInfo?.role as AppRole) || 'customer',
          branch_id: roleInfo?.branch_id || null,
          created_at: profile.created_at,
        };
      }) as UserWithRole[];
    },
    staleTime: 1000 * 60,
  });

  const removeTeamMember = useMutation({
    mutationFn: async (userId: string) => {
      // Remove user role (reverts them to customer)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;

      // Also remove from riders table if they were a rider
      await supabase.from('riders').delete().eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Team member removed successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to remove: ${err?.message || 'Unknown error'}`);
    },
  });

  const filteredUsers = useMemo(() => users?.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.phone?.includes(searchQuery);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  }), [users, searchQuery, filterRole]);

  const roleStats = useMemo(() => users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<AppRole, number>) || {}, [users]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Team Management</h1>
          </div>
          <Button size="icon" className="rounded-xl" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 rounded-2xl bg-secondary border-0" />
        </div>
      </div>

      <div className="px-4 pb-4 overflow-x-auto">
        <div className="flex gap-2">
          <Button variant={filterRole === 'all' ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => setFilterRole('all')}>
            All ({users?.length || 0})
          </Button>
          {(Object.keys(roleConfig) as AppRole[]).map(role => {
            const config = roleConfig[role];
            const count = roleStats[role] || 0;
            if (count === 0 && role !== 'rider') return null;
            return (
              <Button key={role} variant={filterRole === role ? 'default' : 'outline'} size="sm" className="rounded-full whitespace-nowrap" onClick={() => setFilterRole(role)}>
                <config.icon className="h-4 w-4 mr-1" />{config.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent rounded-2xl p-4">
            <Bike className="h-6 w-6 mb-2 opacity-80 text-accent-foreground" />
            <p className="text-2xl font-bold text-accent-foreground">{roleStats['rider'] || 0}</p>
            <p className="text-sm text-accent-foreground/80">Active Riders</p>
          </div>
          <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
            <ShieldCheck className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              {(roleStats['admin'] || 0) + (roleStats['order_manager'] || 0) + (roleStats['inventory_manager'] || 0) + (roleStats['support'] || 0)}
            </p>
            <p className="text-sm text-primary-foreground/80">Staff Members</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Team Members</h2>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1"><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-4 w-24" /></div>
                </div>
              </div>
            ))
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No team members found</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add First Member
              </Button>
            </div>
          ) : (
            filteredUsers?.map((user) => {
              const config = roleConfig[user.role];
              const Icon = config.icon;
              return (
                <div key={user.id} className="bg-card rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.full_name || 'Unnamed User'}</p>
                      <p className="text-sm text-muted-foreground">{user.phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={config.color}>{config.label}</Badge>
                        {user.branch_id && branchMap.get(user.branch_id) && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Store className="h-3 w-3" />
                            {branchMap.get(user.branch_id)}
                          </Badge>
                        )}
                      </div>
                      {user.role !== 'customer' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove <strong>{user.full_name || 'this user'}</strong> from the team and revoke their <strong>{config.label}</strong> role. They will become a regular customer. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => removeTeamMember.mutate(user.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={() => { refetch(); setIsCreateOpen(false); }} />
      <AdminBottomNav />
    </div>
  );
}
