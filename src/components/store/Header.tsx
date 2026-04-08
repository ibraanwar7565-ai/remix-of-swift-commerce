import { motion, useAnimation } from 'framer-motion';
import { ShoppingCart, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  minimal?: boolean;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ minimal, title, showBack, onBack }: HeaderProps) {
  const { getTotalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const totalItems = getTotalItems();
  const prevItems = useRef(totalItems);
  const controls = useAnimation();

  useEffect(() => {
    if (totalItems > prevItems.current) {
      controls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotate: [0, -10, 10, -5, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
    prevItems.current = totalItems;
  }, [totalItems, controls]);

  if (minimal) {
    return (
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <h1 className="text-xl font-bold text-foreground">
              {title || 'FreshMart'}
            </h1>
          )}
          
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <motion.div animate={controls}>
                <ShoppingCart className="h-5 w-5" />
              </motion.div>
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
          >
            <span className="text-primary-foreground font-bold text-lg">F</span>
          </motion.div>
          <span className="font-bold text-xl text-foreground">FreshMart</span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/auth')}
              className="rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-primary font-medium"
            >
              Sign In
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/cart')}
          >
            <motion.div animate={controls}>
              <ShoppingCart className="h-5 w-5" />
            </motion.div>
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
