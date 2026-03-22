import { motion } from 'framer-motion';

const categories = [
  { 
    id: 'fruits', 
    name: 'Fruits', 
    emoji: '🍎',
    color: 'bg-red-50 dark:bg-red-950/30'
  },
  { 
    id: 'veggies', 
    name: 'Vegetables', 
    emoji: '🥬',
    color: 'bg-green-50 dark:bg-green-950/30'
  },
  { 
    id: 'dairy', 
    name: 'Dairy', 
    emoji: '🥛',
    color: 'bg-blue-50 dark:bg-blue-950/30'
  },
  { 
    id: 'meat', 
    name: 'Meat', 
    emoji: '🥩',
    color: 'bg-orange-50 dark:bg-orange-950/30'
  },
  { 
    id: 'bakery', 
    name: 'Bakery', 
    emoji: '🥐',
    color: 'bg-amber-50 dark:bg-amber-950/30'
  },
  { 
    id: 'drinks', 
    name: 'Drinks', 
    emoji: '🧃',
    color: 'bg-purple-50 dark:bg-purple-950/30'
  },
  { 
    id: 'spice', 
    name: 'Spice', 
    emoji: '🌶️',
    color: 'bg-orange-50 dark:bg-orange-950/30'
  },
];

interface CategoryImagesProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
}

export function CategoryImages({ onCategorySelect, selectedCategory }: CategoryImagesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-bold text-foreground">
          Categories
        </h2>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          See All
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategorySelect?.(category.id)}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <motion.div 
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${category.color} ${
                  isSelected 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : 'hover:ring-2 hover:ring-border'
                }`}
                whileHover={{ y: -2 }}
              >
                <span className="text-2xl">{category.emoji}</span>
              </motion.div>
              <span className={`text-xs font-medium transition-colors ${
                isSelected ? 'text-primary' : 'text-foreground'
              }`}>
                {category.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
