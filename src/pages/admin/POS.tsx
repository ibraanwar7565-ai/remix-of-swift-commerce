import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/lazy-image';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useBranches } from '@/hooks/useBranches';
import { usePosCheckout, type PosCartItem, type PosPaymentMethod, type PosSale } from '@/hooks/usePosCheckout';
import { CartPanel } from '@/components/admin/pos/CartPanel';
import { ReceiptDialog } from '@/components/admin/pos/ReceiptDialog';

function usePosProducts() {
  return useQuery({
    queryKey: ['pos-products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export default function POS() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { branchId, isMainAdmin } = useUserRole();
  const { branches } = useBranches();
  const { data: products, isLoading } = usePosProducts();
  const checkout = usePosCheckout();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PosPaymentMethod>('cash');
  const [sale, setSale] = useState<PosSale | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branchId);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const cashierName = profile?.full_name || user?.email?.split('@')[0] || 'Cashier';
  const effectiveBranchId = isMainAdmin ? selectedBranchId : branchId;
  const activeBranch = branches.find((b) => b.id === effectiveBranchId) || null;

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => p.category && set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const tax = 0; // Tax-inclusive pricing; adjust here if a tax rate is configured.
  const total = Math.max(subtotal - discount + tax, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.inventory_count <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.inventory_count) {
          toast.error(`Only ${product.inventory_count} in stock`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const inc = (id: string) =>
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === id && i.quantity < i.product.inventory_count
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      ),
    );
  const dec = (id: string) =>
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  const remove = (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id));

  const resetSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setPayment('cash');
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (isMainAdmin && !effectiveBranchId && branches.length > 0) {
      toast.error('Select a branch first');
      return;
    }
    checkout.mutate(
      {
        items: cart,
        paymentMethod: payment,
        customerName,
        customerPhone,
        discount,
        tax,
        branchId: effectiveBranchId,
        cashierId: user?.id,
      },
      {
        onSuccess: (result) => {
          setSale(result);
          setMobileCartOpen(false);
          resetSale();
        },
        onError: (err) => toast.error(err.message || 'Sale failed. Please try again.'),
      },
    );
  };

  const cartPanelProps = {
    items: cart,
    onInc: inc,
    onDec: dec,
    onRemove: remove,
    onClear: resetSale,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    discount,
    setDiscount,
    payment,
    setPayment,
    subtotal,
    tax,
    total,
    onCheckout: handleCheckout,
    isProcessing: checkout.isPending,
  };

  return (
    <div className="flex h-screen flex-col bg-background lg:flex-row">
      {/* Products area */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="no-print border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">POS Terminal</h1>
              <p className="text-xs text-muted-foreground">
                {cashierName}{activeBranch ? ` · ${activeBranch.name}` : ''}
              </p>
            </div>
            {isMainAdmin && branches.length > 0 && (
              <select
                value={effectiveBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value || null)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="h-10 pl-9"
            />
          </div>

          {/* Categories */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Product grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-10 w-10 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => {
                const out = product.inventory_count <= 0;
                const low = !out && product.inventory_count <= 5;
                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: out ? 1 : 0.96 }}
                    onClick={() => addToCart(product)}
                    disabled={out}
                    className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow hover:shadow-md ${
                      out ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="relative aspect-square w-full bg-muted">
                      {product.image_url ? (
                        <LazyImage src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {out ? (
                        <span className="absolute right-1.5 top-1.5 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                          Out
                        </span>
                      ) : low ? (
                        <span className="absolute right-1.5 top-1.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {product.inventory_count} left
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-2">
                      <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">{product.name}</p>
                      <p className="mt-1 text-sm font-bold text-primary">KES {product.price.toLocaleString()}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart — desktop sidebar */}
      <aside className="hidden w-[380px] shrink-0 border-l border-border lg:block">
        <CartPanel {...cartPanelProps} />
      </aside>

      {/* Cart — mobile bottom bar + sheet */}
      {itemCount > 0 && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 lg:hidden">
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <Button className="h-12 w-full justify-between rounded-xl text-base font-semibold">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount} item{itemCount > 1 ? 's' : ''}
                </span>
                <span>KES {total.toLocaleString()}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[88vh] p-0">
              <SheetTitle className="sr-only">Current Sale</SheetTitle>
              <div className="h-full pt-2">
                <CartPanel {...cartPanelProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <ReceiptDialog
        sale={sale}
        branch={activeBranch}
        cashierName={cashierName}
        onClose={() => setSale(null)}
        onNewSale={() => setSale(null)}
      />
    </div>
  );
}
