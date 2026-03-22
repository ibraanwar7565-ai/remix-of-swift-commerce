import { motion } from 'framer-motion';
import { Home, FileText, Heart, ShoppingCart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import React, { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/contexts/LanguageContext';

const navItems: { icon: React.ElementType; labelKey: TranslationKey; path: string }[] = [
  { icon: Home, labelKey: 'home', path: '/store' },
  { icon: FileText, labelKey: 'orders', path: '/orders' },
  { icon: Heart, labelKey: 'favourites', path: '/favourites' },
  { icon: ShoppingCart, labelKey: 'cart', path: '/cart' },
  { icon: User, labelKey: 'account', path: '/account' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartContext = useContext(CartContext);
  const { t } = useLanguage();
  const items = cartContext?.items ?? [];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="absolute inset-0 bg-card/95 backdrop-blur-lg border-t border-border/50" />

      <div className="relative flex items-center justify-around pb-3 pt-2 px-2 max-w-lg mx-auto" style={{ height: 70 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          const isCart = item.labelKey === 'cart';

          return (
            <motion.button
              key={item.labelKey}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-2 min-w-0"
            >
              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                {isCart && totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
