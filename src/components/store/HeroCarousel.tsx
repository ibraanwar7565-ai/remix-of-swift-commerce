import { useState, useEffect } from 'react';
import carouselGrocery1 from '@/assets/carousel-grocery-1.jpg';
import carouselGrocery2 from '@/assets/carousel-grocery-2.jpg';
import carouselGrocery3 from '@/assets/carousel-grocery-3.jpg';
import carouselGrocery4 from '@/assets/carousel-grocery-4.jpg';
import carouselGrocery5 from '@/assets/carousel-grocery-5.jpg';

const slides = [
  { image: carouselGrocery1, title: 'Fresh Groceries', subtitle: 'Farm-to-door in 30 minutes' },
  { image: carouselGrocery2, title: 'Artisan Bakery', subtitle: 'Freshly baked every morning' },
  { image: carouselGrocery3, title: 'Dairy & Eggs', subtitle: 'Premium quality essentials' },
  { image: carouselGrocery4, title: 'Meat & Seafood', subtitle: 'Butcher-quality cuts delivered' },
  { image: carouselGrocery5, title: 'Tropical Fruits', subtitle: 'Seasonal picks just for you' },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="px-4">
      <div className="relative rounded-2xl overflow-hidden h-48">
        <div className="absolute inset-0 transition-opacity duration-500">
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-bold drop-shadow-lg">{slides[current].title}</h3>
            <p className="text-white/80 text-sm drop-shadow-md">{slides[current].subtitle}</p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
