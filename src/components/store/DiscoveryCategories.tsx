import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const categoryImages: Record<string, string> = {
  Vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop',
  Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop',
  Meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop',
  Seafood: 'https://images.unsplash.com/photo-1534483509719-8c867969240d?w=300&h=300&fit=crop',
  Dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop',
  Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop',
  Beverages: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop',
  Snacks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
  Organic: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&h=300&fit=crop',
  Bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
};

const defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop';

interface DiscoveryCategoriesProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function DiscoveryCategories({ onCategorySelect, selectedCategory }: DiscoveryCategoriesProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="px-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-28 h-36 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section>
      <div className="px-4 mb-3">
        <h2 className="text-xl font-bold text-foreground">What's on your mind?</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Browse by category and pick your next meal</p>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {categories.map((cat, i) => {
          const isActive = selectedCategory === cat;
          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategorySelect?.(isActive ? null : cat)}
              className="shrink-0"
            >
              <div className={`w-28 h-28 rounded-2xl overflow-hidden relative ${
                isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}>
                <img
                  src={categoryImages[cat] || defaultImage}
                  alt={cat}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className={`text-xs font-medium mt-1.5 text-center ${
                isActive ? 'text-primary' : 'text-foreground'
              }`}>{cat}</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
