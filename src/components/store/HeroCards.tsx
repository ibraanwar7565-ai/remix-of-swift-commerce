import { memo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

const categoryImages: Record<string, string> = {
  Vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
  Fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=400&fit=crop',
  Organic: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop',
  Dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&h=400&fit=crop',
  Meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop',
  Seafood: 'https://images.unsplash.com/photo-1534483509719-8c867969240d?w=600&h=400&fit=crop',
  Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
  Beverages: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop',
  Snacks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=400&fit=crop',
};

const categoryOverlays: Record<string, string> = {
  Vegetables: 'from-green-900/80 via-green-800/50 to-transparent',
  Fruits: 'from-orange-900/80 via-orange-800/50 to-transparent',
  Organic: 'from-emerald-900/80 via-emerald-800/50 to-transparent',
  Dairy: 'from-blue-900/80 via-blue-800/50 to-transparent',
  Meat: 'from-red-900/80 via-red-800/50 to-transparent',
  Seafood: 'from-cyan-900/80 via-cyan-800/50 to-transparent',
  Grains: 'from-yellow-900/80 via-yellow-800/50 to-transparent',
  Beverages: 'from-amber-900/80 via-amber-800/50 to-transparent',
  Snacks: 'from-pink-900/80 via-pink-800/50 to-transparent',
};

const defaultImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop';
const defaultOverlay = 'from-gray-900/80 via-gray-800/50 to-transparent';

interface HeroCardsProps {
  onCategorySelect?: (category: string) => void;
}

export function HeroCards({ onCategorySelect }: HeroCardsProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) return null;

  const displayCategories = categories.slice(0, 4);

  return (
    <section className="px-4">
      <div className="grid grid-cols-2 gap-3">
        {displayCategories.map((cat) => (
          <div
            key={cat}
            onClick={() => onCategorySelect?.(cat)}
            className="relative overflow-hidden rounded-2xl h-36 cursor-pointer group active:scale-[0.98] transition-transform"
          >
            <img
              src={categoryImages[cat] || defaultImage}
              alt={cat}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className={`absolute inset-0 bg-gradient-to-tr ${categoryOverlays[cat] || defaultOverlay}`} />
            <div className="relative z-10 flex flex-col justify-end h-full p-4">
              <p className="text-xs font-semibold text-white/90 tracking-wide">SHOP NOW</p>
              <h3 className="text-lg font-bold text-white">{cat}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
