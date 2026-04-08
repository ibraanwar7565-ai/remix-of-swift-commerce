import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-forest">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+')] bg-repeat"></div>
      </div>
      
      {/* Decorative circles */}
      <div className="absolute right-20 top-20 h-64 w-64 rounded-full bg-amber opacity-10" />
      <div className="absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-gold opacity-[0.08]" />
      
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl animate-fade-in">
          <span className="inline-block rounded-full bg-amber/20 px-4 py-1.5 font-body text-sm font-medium text-amber">
            Authentic African Crafts
          </span>
          
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Discover the Beauty of
            <span className="block text-amber">African Heritage</span>
          </h1>
          
          <p className="mt-4 max-w-lg font-body text-lg text-primary-foreground/80">
            Handpicked artisanal products directly from skilled craftsmen across Kenya. 
            Every purchase supports local communities.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 active:scale-95 transition-transform"
            >
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 active:scale-95 transition-transform"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-1 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 100V50C240 83.33 480 100 720 100C960 100 1200 83.33 1440 50V100H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
