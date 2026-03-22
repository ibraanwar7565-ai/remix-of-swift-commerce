import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Plus, MapPin, Phone, Clock, Edit2, Trash2, Store, Check, X, Users, Tag, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { useBranches, type Branch } from '@/hooks/useBranches';
import { useCustomerBranchSelections } from '@/hooks/useUserBranch';

interface BranchFormData {
  name: string;
  address_line: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
}

const emptyForm: BranchFormData = {
  name: '', address_line: '', city: 'Nairobi',
  phone: '',
  opening_time: '08:00', closing_time: '21:00', is_active: true,
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const { branches, isLoading, createBranch, updateBranch, deleteBranch } = useBranches();
  const { data: customerSelections, isLoading: selectionsLoading } = useCustomerBranchSelections();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormData>(emptyForm);

  const openCreate = () => {
    setEditingBranch(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      address_line: branch.address_line,
      city: branch.city || 'Nairobi',
      phone: branch.phone || '',
      opening_time: branch.opening_time || '08:00',
      closing_time: branch.closing_time || '21:00',
      is_active: branch.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.address_line) {
      const missing: string[] = [];
      if (!form.name) missing.push('Branch Name');
      if (!form.address_line) missing.push('Address');
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    const payload = {
      name: form.name,
      address_line: form.address_line,
      city: form.city,
      phone: form.phone || null,
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      is_active: form.is_active,
    };
    if (editingBranch) {
      updateBranch.mutate({ id: editingBranch.id, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      createBranch.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };


  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-6">
        {/* Branch Management Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Branch Locations</h2>
            </div>
            <Button size="sm" className="rounded-xl gap-1" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">No branches yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add your first grocery branch location</p>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Add First Branch
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map(branch => (
                <div key={branch.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{branch.name}</h3>
                        <Badge className={branch.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(branch)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteBranch.mutate(branch.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{branch.address_line}, {branch.city}</span>
                    </div>
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{branch.opening_time} – {branch.closing_time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Branch Selections */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Customer Branch Selections</h2>
          </div>
          {selectionsLoading ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : !customerSelections || customerSelections.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No customers have selected a branch yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customerSelections.map((sel: any) => (
                <div key={sel.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Customer: {sel.user_id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">
                      Branch: {sel.branches?.name || 'Unknown'} — {sel.branches?.address_line}, {sel.branches?.city}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {new Date(sel.updated_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Promo Codes link */}
        <div className="px-4 space-y-3">
          <button
            onClick={() => navigate('/admin/promo-codes')}
            className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Promo Codes</p>
              <p className="text-xs text-muted-foreground">Create and manage discount codes</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </button>

          <button
            onClick={() => navigate('/admin/promotions')}
            className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Promotions</p>
              <p className="text-xs text-muted-foreground">Scheduled promotional notifications to users</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </button>
        </div>

      {/* Branch Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-4 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Westlands Branch" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Address *</Label>
              <Input value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))} placeholder="Street address" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Nairobi" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254 7XX XXX XXX" className="mt-1 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opening Time</Label>
                <Input type="time" value={form.opening_time} onChange={e => setForm(f => ({ ...f, opening_time: e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input type="time" value={form.closing_time} onChange={e => setForm(f => ({ ...f, closing_time: e.target.value }))} className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
            <Button className="w-full rounded-xl" onClick={handleSubmit} disabled={createBranch.isPending || updateBranch.isPending}>
              {createBranch.isPending || updateBranch.isPending ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminBottomNav />
    </div>
  );
}
