import { memo } from 'react';
import { Carrot, Apple, Beef, Fish, Milk, Wheat, Coffee, ShoppingBasket, Cookie, Leaf, Flame, LucideIcon } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const categoryIcons: Record<string, { icon: LucideIcon; color: string }> = {
  Vegetables: { icon: Carrot, color: 'text-green-500' },
  Fruits: { icon: Apple, color: 'text-red-500' },
  Meat: { icon: Beef, color: 'text-amber-700' },
  Seafood: { icon: Fish, color: 'text-blue-500' },
  Dairy: { icon: Milk, color: 'text-cyan-400' },
  Grains: { icon: Wheat, color: 'text-yellow-600' },
  Beverages: { icon: Coffee, color: 'text-amber-800' },
  Snacks: { icon: Cookie, color: 'text-pink-500' },
  Organic: { icon: Leaf, color: 'text-emerald-500' },
  Spice: { icon: Flame, color: 'text-orange-600' },
};

const defaultCategoryIcon = { icon: ShoppingBasket, color: 'text-primary' };

interface QuickActionsProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function QuickActions({ onCategorySelect, selectedCategory }: QuickActionsProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="px-4">
        <h2 className="text-base font-bold text-foreground mb-3">Categories</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Categories</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {/* All button */}
        <button
          onClick={() => onCategorySelect?.(null)}
          className="flex flex-col items-center gap-2 min-w-[60px] active:scale-95 transition-transform"
        >
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors ${
            !selectedCategory ? 'bg-primary/10 border-primary' : 'bg-card border-border/50 hover:border-primary/50'
          }`}>
            <ShoppingBasket className={`h-6 w-6 ${!selectedCategory ? 'text-primary' : 'text-primary'}`} />
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${!selectedCategory ? 'text-primary' : 'text-muted-foreground'}`}>
            All
          </span>
        </button>

        {categories.map((cat) => {
          const { icon: Icon, color } = categoryIcons[cat] || defaultCategoryIcon;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategorySelect?.(cat)}
              className="flex flex-col items-center gap-2 min-w-[60px] active:scale-95 transition-transform"
            >
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors ${
                isActive ? 'bg-primary/10 border-primary' : 'bg-card border-border/50 hover:border-primary/50'
              }`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {cat}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
