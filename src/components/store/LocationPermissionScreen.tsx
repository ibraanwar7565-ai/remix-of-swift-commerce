import { motion } from 'framer-motion';
import { MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function LocationPermissionScreen({ onAllow, onSkip, isLoading }: LocationPermissionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-background px-6 py-12"
    >
      {/* Top spacer */}
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Location pin icon with home */}
        <motion.div
          initial={{ scale: 0, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative"
        >
          <div className="w-24 h-28 relative">
            {/* Pin shape */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-300/40 dark:shadow-orange-500/20">
              <Home className="h-10 w-10 text-white" />
            </div>
            {/* Pin tail */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-orange-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-bold text-foreground">Allow Location Access</h1>
          <p className="text-muted-foreground text-base max-w-xs leading-relaxed">
            We use your location to help you find the best services and deliver to your doorstep.
          </p>
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full space-y-3 max-w-sm"
      >
        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <div className="w-6 h-2 rounded-full bg-foreground" />
        </div>

        <Button
          onClick={onAllow}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5 animate-pulse" />
              Detecting location...
            </span>
          ) : (
            'ALLOW LOCATION'
          )}
        </Button>

        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </motion.div>
  );
}
