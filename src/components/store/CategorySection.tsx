import { Apple, Carrot, Milk, Croissant, Fish, Beef, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/contexts/LanguageContext';

const categories: { id: string; nameKey: TranslationKey; icon: any; color: string }[] = [
  { id: 'fruits', nameKey: 'catFruits', icon: Apple, color: 'bg-red-100' },
  { id: 'veggies', nameKey: 'catVeggies', icon: Carrot, color: 'bg-orange-100' },
  { id: 'dairy', nameKey: 'catDairy', icon: Milk, color: 'bg-blue-100' },
  { id: 'bakery', nameKey: 'catBakery', icon: Croissant, color: 'bg-amber-100' },
  { id: 'seafood', nameKey: 'catSeafood', icon: Fish, color: 'bg-cyan-100' },
  { id: 'meat', nameKey: 'catMeat', icon: Beef, color: 'bg-pink-100' },
  { id: 'spice', nameKey: 'catSpice', icon: Flame, color: 'bg-orange-100' },
];

interface CategorySectionProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
}

export function CategorySection({ onCategorySelect, selectedCategory }: CategorySectionProps) {
  const { t } = useLanguage();
  return (
    <section className="py-4">
      <h2 className="text-lg font-bold text-foreground mb-4 px-4">
        {t('shopByCategory')}
      </h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className={`flex flex-col items-center gap-2 min-w-[70px] active:scale-95 transition-transform ${
              selectedCategory === category.id ? 'opacity-100' : 'opacity-80'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center shadow-sm transition-transform hover:scale-105`}>
              <category.icon className="w-7 h-7 text-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t(category.nameKey)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
