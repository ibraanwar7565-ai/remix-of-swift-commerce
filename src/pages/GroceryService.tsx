import { useState, memo } from 'react';
import { ArrowLeft, ShoppingCart, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useServiceProducts, useServiceCategories } from '@/hooks/useServiceProducts';
import { useCart } from '@/contexts/CartContext';
import { CartProvider } from '@/contexts/CartContext';
import { BottomNav } from '@/components/store/BottomNav';
import { CartDrawer } from '@/components/store/CartDrawer';
import { FloatingCart } from '@/components/store/FloatingCart';
import { Skeleton } from '@/components/ui/skeleton';

const categoryEmojis: Record<string, string> = {
  'Fruits & Vegetables': '🥬',
  'Dairy & Eggs': '🥛',
  'Bakery': '🥐',
  'Beverages': '🥤',
  'Pantry': '🫙',
  'Meat & Seafood': '🥩',
  'Snacks': '🍿',
  'Cleaning Supplies': '🧹',
  'Baby Care': '👶',
};

function GroceryContent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: products, isLoading } = useServiceProducts('grocery', selectedCategory);
  const { data: categories, isLoading: catsLoading } = useServiceCategories('grocery');
  const { addToCart, getTotalItems } = useCart();

  const filtered = products?.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Grocery</h1>
          </div>
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-5 w-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Store Info */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <p className="text-xs text-muted-foreground">Shopping at</p>
        <p className="text-sm font-semibold">HalloFresh Market</p>
        <p className="text-xs text-muted-foreground">Delivery in 60 min • KES 300</p>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for groceries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 active:scale-95 ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-muted-foreground hover:bg-accent'
            }`}
          >
            🛒 All
          </button>
          {catsLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full shrink-0" />
            ))
          ) : (
            categories?.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
              >
                <span>{categoryEmojis[cat] || '📦'}</span>
                {cat}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4">
        {selectedCategory && (
          <h2 className="text-base font-semibold mb-3">{selectedCategory}</h2>
        )}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-3">
                <Skeleton className="h-24 w-full rounded-xl mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">No grocery items found</h3>
            <p className="text-sm text-muted-foreground">Check back soon for new products</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl p-3 border border-border"
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded-xl mb-2" />
                ) : (
                  <div className="w-full h-24 rounded-xl bg-muted flex items-center justify-center mb-2">
                    <span className="text-2xl">🥬</span>
                  </div>
                )}
                {product.discount_percent && product.discount_percent > 0 && (
                  <span className="inline-block text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-md mb-1">
                    -{product.discount_percent}%
                  </span>
                )}
                <h4 className="text-sm font-semibold line-clamp-2">{product.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{product.unit || 'each'}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 text-[hsl(var(--star-yellow))] fill-[hsl(var(--star-yellow))]" />
                  <span className="text-xs">4.5</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-sm font-bold text-primary">KES {product.price.toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through ml-1">KES {product.original_price.toLocaleString()}</span>
                    )}
                  </div>
                  <Button size="sm" className="h-7 w-7 p-0 rounded-full" onClick={() => addToCart(product)}>
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingCart />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}

export default function GroceryService() {
  return (
    <CartProvider>
      <GroceryContent />
    </CartProvider>
  );
}
