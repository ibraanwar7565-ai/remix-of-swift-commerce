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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="absolute inset-0 bg-card border-t border-border/50" />

      <div className="relative flex items-center justify-around pb-3 pt-2 px-2 max-w-lg mx-auto" style={{ height: 70 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          const isCart = item.labelKey === 'cart';

          return (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-2 min-w-0 active:scale-90 transition-transform"
            >
              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                {isCart && totalItems > 0 && (
                  <span
                    className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-scale-in"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="relative text-center py-1 border-t border-border/30">
        <span className="text-[9px] text-muted-foreground/60 font-medium tracking-wide">
          Developed by Nexacore..
        </span>
      </div>
    </nav>
  );
}
