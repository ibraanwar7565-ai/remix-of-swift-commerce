import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import avatarVideo1 from '@/assets/avatar-delivery-1.mp4';
import avatarVideo2 from '@/assets/avatar-delivery-2.mp4';
import avatarVideo3 from '@/assets/avatar-delivery-3.mp4';

interface TestimonialsSectionProps {
  isDark: boolean;
  textMuted: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
}

const testimonials = [
  { quote: "The quality of the groceries is unmatched. I've tried many services, but HALLOFRESH actually delivers farm-fresh produce that lasts all week.", name: 'Sarah Jenkins', role: 'Loyal Customer · 2 years', rating: 5, video: avatarVideo1 },
  { quote: "Ordered a gourmet dinner and it arrived in 20 minutes. Still hot, perfectly plated. Simply the best delivery service in Nairobi.", name: 'Mark Thompson', role: 'Food Enthusiast', rating: 5, video: avatarVideo2 },
  { quote: "The pharmacy service is a lifesaver. Being able to get prescriptions delivered same-day is a luxury I can't live without anymore.", name: 'Elena Rodriguez', role: 'Health & Wellness', rating: 5, video: avatarVideo3 },
  { quote: "As a busy mom of three, HALLOFRESH saves me hours every week. The quality is consistent and the riders are always polite and on time.", name: 'Amina Wanjiku', role: 'Verified Customer', rating: 5, video: avatarVideo1 },
  { quote: "Their organic produce section is incredible. I've stopped going to the supermarket entirely. Everything arrives fresh and well-packaged.", name: 'David Ochieng', role: 'Organic Advocate', rating: 5, video: avatarVideo2 },
  { quote: "The real-time tracking is amazing. I can literally watch my groceries move from the store to my door. Best tech experience in delivery.", name: 'Lucy Muthoni', role: 'Tech Professional', rating: 5, video: avatarVideo3 },
];

export function TestimonialsSection({ isDark, textMuted, textSecondary, cardBg, cardBorder }: TestimonialsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCount = 3;

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  // Get visible testimonials (circular)
  const visible = Array.from({ length: visibleCount }, (_, i) => {
    const idx = (activeIndex + i) % testimonials.length;
    return { ...testimonials[idx], idx };
  });

  return (
    <section className="px-6 md:px-16 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-primary text-primary" />
          ))}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Loved by Thousands</h2>
        <p className={`${textMuted} mt-2`}>Real stories from real customers across Nairobi</p>
      </motion.div>

      {/* Carousel */}
      <div className="max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((t, i) => (
            <div
              key={`${t.idx}-${activeIndex}`}
              className={`${cardBg} border ${cardBorder} rounded-2xl p-6 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative animate-fade-in`}
            >
              <Quote className={`h-8 w-8 ${isDark ? 'text-primary/15' : 'text-primary/10'} absolute top-4 right-4`} />

              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background shrink-0">
                  <video src={t.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-primary">{t.role}</p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-[hsl(42,100%,50%)] text-[hsl(42,100%,50%)]" />
                ))}
              </div>

              <p className={`text-sm ${textSecondary} leading-relaxed`}>"{t.quote}"</p>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} flex items-center justify-center transition-colors`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-1.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 bg-primary' : `w-2 ${isDark ? 'bg-white/20' : 'bg-black/20'}`
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} flex items-center justify-center transition-colors`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
