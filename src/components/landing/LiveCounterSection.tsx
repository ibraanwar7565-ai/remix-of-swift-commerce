import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ShoppingBag, Truck, Users, TrendingUp } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

interface LiveCounterSectionProps {
  isDark: boolean;
  bgAlt: string;
  navBorder: string;
  textMuted: string;
}

const counters = [
  { icon: ShoppingBag, value: 12847, suffix: '+', label: 'Orders Today', color: 'text-primary' },
  { icon: Users, value: 50000, suffix: '+', label: 'Happy Customers', color: 'text-[hsl(270,60%,55%)]' },
  { icon: Truck, value: 982, suffix: '', label: 'Active Riders', color: 'text-[hsl(25,95%,55%)]' },
  { icon: TrendingUp, value: 99, suffix: '%', label: 'Satisfaction Rate', color: 'text-[hsl(200,80%,50%)]' },
];

export function LiveCounterSection({ isDark, bgAlt, navBorder, textMuted }: LiveCounterSectionProps) {
  return (
    <section className={`${bgAlt} border-y ${navBorder} transition-colors duration-500 relative overflow-hidden`}>
      {/* Decorative pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-16 py-14 relative z-10">
        {counters.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-black/5'} mb-3`}>
                <Icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <p className={`text-3xl md:text-4xl font-extrabold ${c.color}`}>
                <AnimatedCounter target={c.value} suffix={c.suffix} />
              </p>
              <p className={`text-sm ${textMuted} mt-1`}>{c.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 pb-6 relative z-10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className={`text-xs ${textMuted} font-medium`}>Live — Updated every minute</span>
      </div>
    </section>
  );
}
