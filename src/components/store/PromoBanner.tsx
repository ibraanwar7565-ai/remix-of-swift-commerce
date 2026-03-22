import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  discount?: string;
  onShopNow?: () => void;
}

export function PromoBanner({
  title = 'Organic Weekend',
  subtitle = 'Get 20% off all leafy greens',
  discount = 'PROMO',
  onShopNow,
}: PromoBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <span className="inline-block bg-primary-foreground/20 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-3">
          {discount}
        </span>
        <h3 className="text-2xl font-bold mb-1">{title}</h3>
        <p className="text-primary-foreground/80 text-sm mb-4">{subtitle}</p>
        <Button
          onClick={onShopNow}
          variant="secondary"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold"
        >
          Shop Fresh
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
