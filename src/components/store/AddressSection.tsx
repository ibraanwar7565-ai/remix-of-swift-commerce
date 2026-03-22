import { motion } from 'framer-motion';
import { MapPin, CheckCircle2 } from 'lucide-react';

interface AddressSectionProps {
  location: string;
  onManageClick: () => void;
}

export function AddressSection({ location, onManageClick }: AddressSectionProps) {
  return (
    <section className="px-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Manage Your Addresses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Quick access to your saved and recent places</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-warning" />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onManageClick}
        className="w-full mt-2 p-3 rounded-xl border border-primary/40 bg-primary/5 flex items-center gap-3 text-left"
      >
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Selected</p>
          <p className="text-sm text-muted-foreground truncate">{location}</p>
        </div>
      </motion.button>
    </section>
  );
}
