import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { ProductListItem } from './ProductListItem';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductListProps {
  searchQuery?: string;
  category?: string;
}

export function ProductList({ searchQuery, category }: ProductListProps) {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-card rounded-2xl">
            <Skeleton className="w-24 h-24 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-5 w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground">
        Failed to load products. Please try again.
      </div>
    );
  }

  // Filter products
  let filteredProducts = products || [];
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      p => p.name.toLowerCase().includes(query) ||
           p.description?.toLowerCase().includes(query)
    );
  }
  
  if (category) {
    filteredProducts = filteredProducts.filter(
      p => p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 space-y-3"
    >
      {filteredProducts.map((product, index) => (
        <ProductListItem
          key={product.id}
          product={product}
          index={index}
        />
      ))}
    </motion.div>
  );
}
