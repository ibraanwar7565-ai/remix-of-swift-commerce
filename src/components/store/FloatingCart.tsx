import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function FloatingCart() {
  const { items, setIsCartOpen } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-warning flex items-center justify-center shadow-lg"
    >
      <ShoppingCart className="h-6 w-6 text-foreground" />
      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
        {totalItems}
      </span>
    </motion.button>
  );
}
