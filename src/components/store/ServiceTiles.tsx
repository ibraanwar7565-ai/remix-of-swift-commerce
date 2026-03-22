import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const categoryImages: Record<string, string> = {
  'Fruits & Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop',
  'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&h=300&fit=crop',
  'Meat & Seafood': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop',
  'Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=300&fit=crop',
  'Snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop',
  'Pantry': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop',
  'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop',
};

const defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop';

interface ServiceTilesProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function ServiceTiles({ onCategorySelect, selectedCategory }: ServiceTilesProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="px-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="px-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((cat, i) => {
          const isActive = selectedCategory === cat;
          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategorySelect?.(isActive ? null : cat)}
              className="flex flex-col items-center gap-2 min-w-[80px]"
            >
              <div className={`w-20 h-20 rounded-2xl overflow-hidden shadow-md transition-all ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'ring-2 ring-border hover:ring-primary/50'
              }`}>
                <img
                  src={categoryImages[cat] || defaultImage}
                  alt={cat}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-xs font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-foreground'
              }`}>{cat}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
