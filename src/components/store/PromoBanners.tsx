import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import promoDelivery from '@/assets/promo-free-delivery.jpg';
import promoDeals from '@/assets/promo-fresh-deals.jpg';
import promoWelcome from '@/assets/promo-welcome.jpg';
import promoExpress from '@/assets/promo-express.jpg';
import promoOrganic from '@/assets/promo-organic.jpg';

const promos = [
  {
    title: 'Free Delivery',
    subtitle: 'On all orders — no minimum spend!',
    badge: '🚚 FREE',
    image: promoDelivery,
    path: '/grocery',
  },
  {
    title: 'Fresh Deals',
    subtitle: 'Up to 30% off fruits & vegetables this week',
    badge: '🔥 HOT DEAL',
    image: promoDeals,
    path: '/grocery',
  },
  {
    title: 'New Customer?',
    subtitle: 'Get KES 200 off your first order',
    badge: '🎁 WELCOME',
    image: promoWelcome,
    path: '/grocery',
  },
  {
    title: 'Express 30 Min',
    subtitle: 'Lightning-fast delivery on essentials',
    badge: '⚡ FAST',
    image: promoExpress,
    path: '/grocery',
  },
  {
    title: 'Go Organic',
    subtitle: '100% certified organic produce available',
    badge: '🌿 ORGANIC',
    image: promoOrganic,
    path: '/grocery',
  },
];

export function PromoBanners() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {promos.map((promo, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(promo.path)}
            className="relative min-w-[280px] h-[160px] rounded-2xl overflow-hidden snap-start shrink-0 text-left"
          >
            {/* Background image */}
            <img
              src={promo.image}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-4">
              <span className="inline-flex self-start items-center gap-1 bg-white/20 backdrop-blur-sm text-[11px] font-bold px-2.5 py-1 rounded-full mb-2 text-white">
                {promo.badge}
              </span>
              <h3 className="text-lg font-extrabold leading-tight mb-0.5 text-white drop-shadow-md">
                {promo.title}
              </h3>
              <p className="text-white/85 text-xs leading-relaxed mb-2 drop-shadow-sm">
                {promo.subtitle}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
