import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { BottomNav } from '@/components/store/BottomNav';
import { CartDrawer } from '@/components/store/CartDrawer';
import { FloatingCart } from '@/components/store/FloatingCart';
import { Skeleton } from '@/components/ui/skeleton';

type TabType = 'items' | 'restaurants';

function FavouritesContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<TabType>('items');

  const { data: favourites, isLoading } = useQuery({
    queryKey: ['favorites-with-products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('*, products:product_id (*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleAddToCart = (product: any) => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background border-b border-border"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Favourites</h1>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['items', 'restaurants'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-base font-semibold transition-colors relative ${
              activeTab === tab ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {tab === 'items' ? 'Items' : 'Restaurants'}
            {activeTab === tab && (
              <motion.div
                layoutId="fav-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Sign in to view favourites</h2>
            <p className="text-sm text-muted-foreground mb-6">Save your favourite items for quick access</p>
            <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-card rounded-2xl">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : activeTab === 'items' ? (
          /* Items Tab */
          (!favourites || favourites.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">No favourite data found</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                Items you mark as favourite will appear here
              </p>
              <Button onClick={() => navigate('/store')} className="rounded-full px-6">
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {favourites.map((fav: any, index: number) => {
                const product = fav.products;
                if (!product) return null;
                return (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-card rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-base text-foreground">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{product.category || 'Grocery'}</p>
                            {product.discount_percent && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3 w-3 text-warning fill-warning" />
                                <span className="text-xs text-muted-foreground">
                                  {product.discount_percent}% off
                                </span>
                              </div>
                            )}
                          </div>
                          <Heart className="h-5 w-5 text-destructive fill-destructive shrink-0" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-primary">
                            KES {product.price.toLocaleString()}
                            {product.unit && <span className="text-xs font-normal text-muted-foreground">/{product.unit}</span>}
                          </span>
                          <Button
                            size="sm"
                            className="rounded-full h-8 px-4 text-xs font-semibold"
                            onClick={() => handleAddToCart(product)}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* Restaurants Tab - Empty for now */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No favourite restaurants</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
              Restaurants you mark as favourite will appear here
            </p>
            <Button onClick={() => navigate('/store')} className="rounded-full px-6">
              Browse Restaurants
            </Button>
          </div>
        )}
      </div>

      <FloatingCart />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}

export default function Favourites() {
  return (
    <CartProvider>
      <FavouritesContent />
    </CartProvider>
  );
}
