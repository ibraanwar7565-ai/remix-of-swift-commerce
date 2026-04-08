import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

import promoDelivery from '@/assets/promo-free-delivery.jpg';
import promoDeals from '@/assets/promo-fresh-deals.jpg';
import promoWelcome from '@/assets/promo-welcome.jpg';
import promoExpress from '@/assets/promo-express.jpg';
import promoOrganic from '@/assets/promo-organic.jpg';

// Fallback banners when no DB promotions exist
const fallbackPromos = [
  { title: 'Free Delivery', subtitle: 'On all orders — no minimum spend!', badge: '🚚 FREE', image: promoDelivery, path: '/grocery' },
  { title: 'Fresh Deals', subtitle: 'Up to 30% off fruits & vegetables this week', badge: '🔥 HOT DEAL', image: promoDeals, path: '/grocery' },
  { title: 'New Customer?', subtitle: 'Get KES 200 off your first order', badge: '🎁 WELCOME', image: promoWelcome, path: '/grocery' },
  { title: 'Express 30 Min', subtitle: 'Lightning-fast delivery on essentials', badge: '⚡ FAST', image: promoExpress, path: '/grocery' },
  { title: 'Go Organic', subtitle: '100% certified organic produce available', badge: '🌿 ORGANIC', image: promoOrganic, path: '/grocery' },
];

export function PromoBanners() {
  const navigate = useNavigate();

  const { data: dbPromos = [], isLoading } = useQuery({
    queryKey: ['active-promo-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, product_name, message, price, banner_image_url, banner_link')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Merge DB promos (with banner images) + fallbacks
  const dbBanners = dbPromos
    .filter((p: any) => p.banner_image_url)
    .map((p: any) => ({
      title: p.product_name,
      subtitle: p.message,
      badge: '🎉 PROMO',
      image: p.banner_image_url,
      path: p.banner_link || '/grocery',
    }));

  const promos = dbBanners.length > 0 ? [...dbBanners, ...fallbackPromos.slice(0, 2)] : fallbackPromos;

  if (isLoading) {
    return (
      <section className="px-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="min-w-[280px] h-[160px] rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {promos.map((promo, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'tween', duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(promo.path)}
            className="relative min-w-[280px] h-[160px] rounded-2xl overflow-hidden snap-start shrink-0 text-left"
          >
            <img
              src={promo.image}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
            <div className="relative z-10 flex flex-col justify-end h-full p-4">
              <span className="inline-flex self-start items-center gap-1 bg-white/20 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2 text-white">
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
