import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroPromoBannerProps {
  onShopNow?: () => void;
}

export function HeroPromoBanner({ onShopNow }: HeroPromoBannerProps) {
  return (
    <div className="mx-4 animate-fade-in">
      <div className="relative rounded-3xl overflow-hidden h-44 bg-gradient-to-br from-primary via-primary to-primary/80">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* Background Image */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-30"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop)',
            maskImage: 'linear-gradient(to right, transparent, black)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black)',
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center p-6">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              Weekend Special
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-white leading-tight mb-1">
            Fresh Organic
          </h2>
          <p className="text-white/80 text-sm mb-4">
            Get 20% off leafy greens
          </p>
          
          <div>
            <Button
              onClick={onShopNow}
              className="bg-white text-primary hover:bg-white/90 rounded-full font-semibold h-10 px-5 shadow-lg w-fit"
            >
              Shop Now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
