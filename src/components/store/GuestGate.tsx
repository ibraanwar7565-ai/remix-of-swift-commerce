import { motion } from 'framer-motion';
import { ShoppingBag, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface GuestGateProps {
  onBrowse: () => void;
}

export function GuestGate({ onBrowse }: GuestGateProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-center space-y-6 max-w-sm w-full"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome to HalloFresh</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to enjoy the full experience, or browse our products first.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/auth')}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In / Register
          </Button>

          <Button
            variant="outline"
            onClick={onBrowse}
            className="w-full h-12 text-base"
            size="lg"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            Browse as Guest
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          You'll need to sign in to add items to your cart
        </p>
      </motion.div>
    </motion.div>
  );
}
