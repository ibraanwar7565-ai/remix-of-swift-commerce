import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilter?: boolean;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder,
  showFilter = true 
}: SearchBarProps) {
  const { t } = useLanguage();
  const displayPlaceholder = placeholder || t('searchPlaceholder');
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={displayPlaceholder}
          className="w-full h-14 pl-12 pr-14 bg-secondary rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        
        {/* Filter Button inside input */}
        {showFilter && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
