import { LayoutGrid, ShoppingCart, Package, Users, Settings, MessageCircle, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

export function AdminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMainAdmin, isAdmin, roles } = useUserRole();

  const isInventoryManager = roles.includes('inventory_manager') && !isAdmin;

  // Inventory managers only see Inventory tab
  if (isInventoryManager) {
    const isActive = location.pathname === '/admin/inventory';
    return (
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50"
      >
        <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
          <motion.button
            onClick={() => navigate('/admin/inventory')}
            className="flex flex-col items-center gap-1 py-2 px-3"
            whileTap={{ scale: 0.85 }}
          >
            <Package className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Inventory</span>
          </motion.button>
        </div>
      </motion.nav>
    );
  }

  const navItems = [
    { icon: LayoutGrid, label: 'Analytics', path: '/admin' },
    { icon: Store, label: 'POS', path: '/admin/pos' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: MessageCircle, label: 'Chat', path: '/admin/chat' },
    { icon: Package, label: 'Inventory', path: '/admin/inventory' },
    { icon: Users, label: 'Team', path: '/admin/users' },
    ...(isMainAdmin ? [{ icon: Settings, label: 'Settings', path: '/admin/settings' }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50"
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 py-2 px-2"
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
            >
              <item.icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
