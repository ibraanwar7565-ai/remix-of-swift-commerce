import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck } from 'lucide-react';

const slides = [
  { title: 'First order?', subtitle: 'Free delivery on us!', icon: Truck },
  { title: 'Fresh Deals', subtitle: '20% off organic greens', icon: Truck },
  { title: 'Refer & Earn', subtitle: 'Get KSh 200 per friend', icon: Truck },
];

export function PromoCard() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="px-4">
      <div className="relative overflow-hidden rounded-2xl p-5 bg-accent">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">{slide.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{slide.subtitle}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <slide.icon className="h-7 w-7 text-primary" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-1.5 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-5 bg-primary' : 'w-1.5 bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
