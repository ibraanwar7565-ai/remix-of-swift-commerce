import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogOut, MapPin, Package, Settings } from 'lucide-react';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  // Always show notification bell
  return (
    <div className="flex items-center">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative h-12 w-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-5 w-5 text-foreground" />
          </motion.button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl shadow-elevated border-border bg-card"
        >
          {user ? (
            <>
              <div className="px-3 py-3 border-b border-border">
                <p className="font-semibold text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">No new notifications</p>
              </div>
              
              <div className="py-1.5">
                <DropdownMenuItem 
                  className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl mx-1.5 focus:bg-secondary"
                  onClick={() => navigate('/orders')}
                >
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>My Orders</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl mx-1.5 focus:bg-secondary">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Saved Addresses</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl mx-1.5 focus:bg-secondary">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator className="mx-3 bg-border" />
              
              <div className="py-1.5">
                <DropdownMenuItem 
                  className="cursor-pointer gap-3 px-3 py-2.5 rounded-xl mx-1.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="text-sm text-muted-foreground mb-3">Sign in to view notifications</p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full rounded-xl"
                size="sm"
              >
                Sign In
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
