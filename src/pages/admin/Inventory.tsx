import { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, ArrowLeft, ShoppingCart, AlertTriangle, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { StockAlerts } from '@/components/admin/StockAlerts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  original_price: string;
  discount_percent: string;
  category: string;
  unit: string;
  inventory_count: string;
  image_url: string;
  is_active: boolean;
}

const defaultForm: ProductForm = {
  name: '', description: '', price: '', original_price: '', discount_percent: '0',
  category: '', unit: 'each', inventory_count: '0', image_url: '', is_active: true,
};

const CATEGORIES = ['Vegetables', 'Fruits', 'Meat', 'Seafood', 'Dairy', 'Grains', 'Beverages', 'Snacks', 'Organic', 'Spice', 'Other'];
const UNITS = ['kg', 'each', 'g', '500g', 'litre', 'ml', 'pack', 'dozen', 'bunch'];

const UnpaidRequestsBanner = () => {
  const { data: unpaidOrders } = useQuery({
    queryKey: ['unpaid-orders-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, customer_name, created_at,
          order_items (
            id, quantity,
            products:product_id (name)
          )
        `)
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 1000 * 30,
  });

  if (!unpaidOrders?.length) return null;

  // Aggregate requested products
  const productMap = new Map<string, number>();
  unpaidOrders.forEach((order: any) => {
    order.order_items?.forEach((item: any) => {
      const name = item.products?.name || 'Unknown';
      productMap.set(name, (productMap.get(name) || 0) + item.quantity);
    });
  });

  return (
    <div className="px-4 mb-2">
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="h-5 w-5 text-red-500" />
          <p className="font-semibold text-red-700 dark:text-red-400">
            {unpaidOrders.length} Unpaid Request{unpaidOrders.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(productMap.entries()).map(([name, qty]) => (
            <Badge key={name} variant="secondary" className="text-xs">
              {name} × {qty}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    staleTime: 1000 * 60,
  });

  const activeCategories = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    return filtered.sort((a, b) => {
      const scoreA = a.inventory_count <= 0 ? 0 : a.inventory_count <= 5 ? 1 : 2;
      const scoreB = b.inventory_count <= 0 ? 0 : b.inventory_count <= 5 ? 1 : 2;
      return scoreA - scoreB;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkToggleActive = async (active: boolean) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('products').update({ is_active: active }).in('id', ids);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `${ids.length} products ${active ? 'activated' : 'deactivated'}` });
    setSelectedIds(new Set());
    setBulkMode(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('products').delete().in('id', ids);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `${ids.length} products deleted` });
    setSelectedIds(new Set());
    setBulkMode(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setIsDialogOpen(true); };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name, description: product.description || '', price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      discount_percent: String(product.discount_percent || 0), category: product.category || '',
      unit: product.unit || 'each', inventory_count: String(product.inventory_count),
      image_url: product.image_url || '', is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast({ title: 'Name and price are required', variant: 'destructive' }); return; }
    setSaving(true);

    const imageUrl = form.image_url || null;

    const payload = {
      name: form.name, description: form.description || null, price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      discount_percent: Number(form.discount_percent) || 0, category: form.category || null,
      unit: form.unit || 'each', inventory_count: Number(form.inventory_count) || 0,
      image_url: imageUrl, is_active: form.is_active,
    };

    let error;
    if (editingId) { ({ error } = await supabase.from('products').update(payload).eq('id', editingId)); }
    else { ({ error } = await supabase.from('products').insert(payload)); }
    setSaving(false);

    if (error) { toast({ title: 'Error saving product', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editingId ? 'Product updated' : 'Product added' });
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleGenerateImage = async () => {
    if (!form.name.trim()) { toast({ title: 'Enter a product name first', variant: 'destructive' }); return; }
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: { product_name: form.name },
      });
      if (error) throw error;
      if (data?.image_url) {
        setForm(f => ({ ...f, image_url: data.image_url }));
        toast({ title: 'Image generated!' });
      }
    } catch (err: any) {
      toast({ title: 'Failed to generate image', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `uploads/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      toast({ title: 'Image uploaded!' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast({ title: 'Error deleting product', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Product deleted' });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Inventory</h1>
          </div>
          <div className="flex gap-2">
            <Button variant={bulkMode ? 'default' : 'outline'} size="sm" className="rounded-xl text-xs" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}>
              {bulkMode ? 'Cancel' : 'Bulk'}
            </Button>
            <Button onClick={openCreate} className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 rounded-2xl bg-secondary border-0" />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {activeCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {bulkMode && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <span className="text-sm font-medium flex-1">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => bulkToggleActive(true)}>Activate</Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => bulkToggleActive(false)}>Deactivate</Button>
            <Button size="sm" variant="destructive" className="text-xs h-8" onClick={bulkDelete}>Delete</Button>
          </div>
        )}
      </div>

      {/* Stock Alerts */}
      <StockAlerts products={allProducts} />

      {/* Incoming Requests (Unpaid orders) */}
      <UnpaidRequestsBanner />

      <div className="px-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4"><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-4 w-24" /></div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isOutOfStock = product.inventory_count <= 0;
            const isLowStock = product.inventory_count > 0 && product.inventory_count <= 5;
            return (
              <div key={product.id} className={`bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4 ${
                isOutOfStock ? 'ring-2 ring-destructive/40' : isLowStock ? 'ring-2 ring-yellow-400/40' : ''
              }`}>
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="w-5 h-5 rounded accent-primary flex-shrink-0"
                  />
                )}
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-destructive bg-background/80 px-1 rounded">OUT</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{product.name}</p>
                    {!product.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    {isLowStock && <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-bold text-sm">KES {product.price}</span>
                    <Badge variant={isOutOfStock ? 'destructive' : isLowStock ? 'outline' : 'secondary'} className={`text-xs ${isLowStock && !isOutOfStock ? 'border-yellow-400 text-yellow-700 dark:text-yellow-400' : ''}`}>
                      {isOutOfStock ? '⚠ Out of Stock' : `Stock: ${product.inventory_count}`}
                    </Badge>
                  </div>
                </div>
                {!bulkMode && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={() => openEdit(product)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fresh Tomatoes" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (KES) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
              <div><Label>Original Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} placeholder="0" /></div>
              <div><Label>Stock Count</Label><Input type="number" value={form.inventory_count} onChange={e => setForm(f => ({ ...f, inventory_count: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Unit</Label><Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger><SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {/* Product Image Section */}
            <div>
              <Label>Product Image</Label>
              <div className="mt-1 space-y-2">
                {form.image_url && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                    >×</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="Or paste image URL..." className="text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active (visible to customers)</Label></div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">{saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminBottomNav />
    </div>
  );
}
