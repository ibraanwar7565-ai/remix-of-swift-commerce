import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface PromoForm {
  code: string;
  description: string;
  discount_type: string;
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  max_uses_per_user: string;
  is_active: boolean;
  expires_at: string;
}

const defaultForm: PromoForm = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_amount: '0', max_uses: '', max_uses_per_user: '1',
  is_active: true, expires_at: '',
};

export default function AdminPromoCodes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, code: generateCode() });
    setIsDialogOpen(true);
  };

  const openEdit = (promo: any) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code, description: promo.description || '',
      discount_type: promo.discount_type, discount_value: String(promo.discount_value),
      min_order_amount: String(promo.min_order_amount || 0),
      max_uses: promo.max_uses ? String(promo.max_uses) : '',
      max_uses_per_user: String(promo.max_uses_per_user || 1),
      is_active: promo.is_active,
      expires_at: promo.expires_at ? promo.expires_at.slice(0, 16) : '',
    });
    setIsDialogOpen(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return 'HF' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast({ title: 'Code and discount value are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      max_uses_per_user: Number(form.max_uses_per_user) || 1,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('promo_codes').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('promo_codes').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Promo code updated' : 'Promo code created' });
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Promo code deleted' });
    queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Promo Codes</h1>
          </div>
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> New Code
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No promo codes yet</p>
            <p className="text-sm mt-1">Create your first discount code</p>
          </div>
        ) : (
          promoCodes.map((promo: any) => {
            const isExpired = promo.expires_at && new Date(promo.expires_at) < new Date();
            const isMaxed = promo.max_uses && promo.uses_count >= promo.max_uses;
            return (
              <div key={promo.id} className={`bg-card rounded-2xl p-4 shadow-sm border ${!promo.is_active || isExpired || isMaxed ? 'border-border opacity-60' : 'border-primary/20'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => copyCode(promo.code, promo.id)} className="flex items-center gap-1 font-mono font-bold text-primary text-lg hover:opacity-70 transition">
                        {promo.code}
                        {copiedId === promo.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      {!promo.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {isExpired && <Badge variant="destructive">Expired</Badge>}
                      {isMaxed && <Badge variant="outline">Maxed</Badge>}
                    </div>
                    {promo.description && <p className="text-sm text-muted-foreground mb-1">{promo.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `KES ${promo.discount_value} off`}
                      </Badge>
                      {promo.min_order_amount > 0 && <Badge variant="outline">Min KES {promo.min_order_amount}</Badge>}
                      <Badge variant="outline">{promo.uses_count}{promo.max_uses ? `/${promo.max_uses}` : ''} used</Badge>
                      {promo.expires_at && <Badge variant="outline">Expires {format(new Date(promo.expires_at), 'MMM d')}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(promo.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="HALLOFRESH10" className="font-mono" />
                <Button variant="outline" type="button" onClick={() => setForm(f => ({ ...f, code: generateCode() }))}>Generate</Button>
              </div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Welcome discount" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value *</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder="10" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Order (KES)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0" className="mt-1" /></div>
              <div><Label>Max Total Uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Per Customer</Label><Input type="number" value={form.max_uses_per_user} onChange={e => setForm(f => ({ ...f, max_uses_per_user: e.target.value }))} placeholder="1" className="mt-1" /></div>
              <div><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">{saving ? 'Saving...' : editingId ? 'Update Code' : 'Create Code'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminBottomNav />
    </div>
  );
}
