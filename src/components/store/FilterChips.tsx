import { motion } from 'framer-motion';
import { Zap, Star, Tag } from 'lucide-react';

const filters = [
  { id: 'all', label: 'All', icon: null },
  { id: 'fast', label: 'Fast Delivery', icon: Zap },
  { id: 'rated', label: 'Top Rated', icon: Star },
  { id: 'promo', label: 'Promo', icon: Tag },
];

interface FilterChipsProps {
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
}

export function FilterChips({ selectedFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        const Icon = filter.icon;
        
        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-primary text-primary-foreground shadow-button'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}
