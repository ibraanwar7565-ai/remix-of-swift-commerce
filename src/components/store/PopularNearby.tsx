import { memo, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridCard } from './ProductGridCard';
import { Skeleton } from '@/components/ui/skeleton';

interface PopularNearbyProps {
  searchQuery?: string;
  category?: string | null;
}

export const PopularNearby = memo(function PopularNearby({ searchQuery, category }: PopularNearbyProps) {
  const { data: products, isLoading, error } = useProducts();

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    return result;
  }, [products, searchQuery, category]);

  if (isLoading) {
    return (
      <section className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Popular Products</h2>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !products || products.length === 0) {
    return (
      <section className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Popular Products</h2>
        <div className="text-center py-8 text-muted-foreground">
          No products available yet
        </div>
      </section>
    );
  }

  if (filtered.length === 0) {
    return (
      <section className="px-4">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {category ? category : 'Popular Products'}
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          No products found
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">
          {category ? category : 'Popular Products'}
        </h2>
        <span className="text-sm text-muted-foreground">{filtered.length} items</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product, index) => (
          <ProductGridCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
});
