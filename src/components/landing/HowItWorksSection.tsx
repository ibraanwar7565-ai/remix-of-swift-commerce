import { motion } from 'framer-motion';
import { Search, ShoppingCart, MapPin, Package } from 'lucide-react';

interface HowItWorksSectionProps {
  isDark: boolean;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
}

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Browse & Discover',
    description: 'Explore thousands of products from groceries to gourmet meals, pharmacy items, and more.',
    color: 'from-primary to-[hsl(140,60%,30%)]',
  },
  {
    icon: ShoppingCart,
    number: '02',
    title: 'Add to Cart',
    description: 'Pick your favorites, apply promo codes, and customize your order to your liking.',
    color: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,38%)]',
  },
  {
    icon: MapPin,
    number: '03',
    title: 'Track in Real-Time',
    description: 'Watch your order move from store to your doorstep with live GPS tracking.',
    color: 'from-[hsl(200,80%,45%)] to-[hsl(210,70%,35%)]',
  },
  {
    icon: Package,
    number: '04',
    title: 'Receive & Enjoy',
    description: 'Get your items delivered fresh and fast. Rate your experience and earn rewards.',
    color: 'from-[hsl(25,90%,50%)] to-[hsl(15,85%,42%)]',
  },
];

export function HowItWorksSection({ isDark, textMuted, cardBg, cardBorder }: HowItWorksSectionProps) {
  return (
    <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
          Simple & Fast
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
        <p className={`${textMuted} max-w-lg mx-auto`}>
          From browsing to delivery in just four easy steps. It's that simple.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connection line */}
        <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Step circle */}
              <div className="relative mb-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </motion.div>
                <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${isDark ? 'bg-[hsl(150,30%,6%)]' : 'bg-[hsl(140,20%,97%)]'} border-2 border-primary text-primary text-xs font-bold flex items-center justify-center`}>
                  {step.number}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className={`text-sm ${textMuted} leading-relaxed max-w-[220px]`}>
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
