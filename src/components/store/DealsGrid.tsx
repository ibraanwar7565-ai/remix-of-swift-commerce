import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridCard } from './ProductGridCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface DealsGridProps {
  limit?: number;
  showSeeAll?: boolean;
}

export function DealsGrid({ limit = 4, showSeeAll = true }: DealsGridProps) {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="px-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/50">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Failed to load products</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const displayProducts = products?.slice(0, limit) || [];

  return (
    <div className="px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Today's Deals</h2>
          <p className="text-xs text-muted-foreground">Fresh picks just for you</p>
        </div>
        {showSeeAll && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary font-medium h-8 px-2 hover:bg-primary/5"
          >
            See All
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {displayProducts.map((product, index) => (
          <ProductGridCard
            key={product.id}
            product={product}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
