import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Megaphone, Pause, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface PromoFormData {
  product_name: string;
  message: string;
  price: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  banner_image_url: string;
  banner_link: string;
}

const emptyForm: PromoFormData = {
  product_name: '', message: '', price: '',
  is_active: true,
  start_date: new Date().toISOString().slice(0, 16),
  end_date: '',
  banner_image_url: '',
  banner_link: '/grocery',
};

export default function AdminPromotions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logsPromoId, setLogsPromoId] = useState<string | null>(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['promo-logs', logsPromoId],
    queryFn: async () => {
      if (!logsPromoId) return [];
      const { data, error } = await supabase
        .from('promotion_notification_logs')
        .select('*')
        .eq('promotion_id', logsPromoId)
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!logsPromoId,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      product_name: p.product_name,
      message: p.message,
      price: String(p.price),
      is_active: p.is_active,
      start_date: p.start_date?.slice(0, 16) || '',
      end_date: p.end_date?.slice(0, 16) || '',
      banner_image_url: p.banner_image_url || '',
      banner_link: p.banner_link || '/grocery',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_name || !form.price || !form.end_date) {
      toast({ title: 'Product name, price, and end date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      product_name: form.product_name.trim(),
      message: form.message.trim() || `${form.product_name} is now available — KSh ${Number(form.price).toLocaleString()}`,
      price: Number(form.price),
      is_active: form.is_active,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      banner_image_url: form.banner_image_url.trim() || null,
      banner_link: form.banner_link.trim() || '/grocery',
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('promotions').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('promotions').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Promotion updated' : 'Promotion created' });
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Promotion deleted' });
    queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('promotions').update({ is_active: !current }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Promotions</h1>
          </div>
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> New Promo
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : promotions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No promotions yet</p>
            <p className="text-sm mt-1">Create your first promotional campaign</p>
          </div>
        ) : (
          promotions.map((promo: any) => {
            const now = new Date();
            const isExpired = new Date(promo.end_date) < now;
            const notStarted = new Date(promo.start_date) > now;
            const isLive = promo.is_active && !isExpired && !notStarted;

            return (
              <div key={promo.id} className={`bg-card rounded-2xl p-4 shadow-sm border transition-colors ${isLive ? 'border-primary/30' : 'border-border opacity-70'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{promo.product_name}</span>
                      {isLive && <Badge className="bg-primary/20 text-primary border-0">Live</Badge>}
                      {!promo.is_active && <Badge variant="secondary">Paused</Badge>}
                      {isExpired && <Badge variant="destructive">Expired</Badge>}
                      {notStarted && <Badge variant="outline">Scheduled</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{promo.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">KSh {Number(promo.price).toLocaleString()}</Badge>
                      <Badge variant="outline">{format(new Date(promo.start_date), 'MMM d')} → {format(new Date(promo.end_date), 'MMM d')}</Badge>
                      {promo.last_sent_at && <Badge variant="outline">Last sent {format(new Date(promo.last_sent_at), 'MMM d, HH:mm')}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(promo.id, promo.is_active)}>
                      {promo.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(promo)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLogsPromoId(promo.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="e.g. Premium Tea" className="mt-1" />
            </div>
            <div>
              <Label>Price (KSh) *</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="20" className="mt-1" />
            </div>
            <div>
              <Label>Notification Message</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Leave blank for auto-generated message" className="mt-1" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">Leave blank: "{form.product_name || 'Product'} is now available — KSh {form.price || '0'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active immediately</Label>
            </div>
            <div>
              <Label>Banner Image URL (optional)</Label>
              <Input value={form.banner_image_url} onChange={e => setForm(f => ({ ...f, banner_image_url: e.target.value }))} placeholder="https://... (image for store banner)" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">If set, this promo will appear as a banner in the store</p>
            </div>
            <div>
              <Label>Banner Link</Label>
              <Input value={form.banner_link} onChange={e => setForm(f => ({ ...f, banner_link: e.target.value }))} placeholder="/grocery" className="mt-1" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
              {saving ? 'Saving...' : editingId ? 'Update Promotion' : 'Create Promotion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Logs Sheet */}
      <Sheet open={!!logsPromoId} onOpenChange={(open) => { if (!open) setLogsPromoId(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notification Delivery Logs</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {logsLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No notifications sent yet</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">{logs.length} notification{logs.length !== 1 ? 's' : ''} sent</p>
                {logs.map((log: any) => (
                  <div key={log.id} className="bg-muted/50 rounded-xl p-3 text-sm flex justify-between">
                    <span className="text-muted-foreground truncate">User: {log.user_id.slice(0, 8)}…</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(log.sent_at), 'MMM d, HH:mm')}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AdminBottomNav />
    </div>
  );
}
