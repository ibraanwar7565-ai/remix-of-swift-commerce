import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, Star, Sun, Moon, Menu, X, Smartphone, Play } from 'lucide-react';
import { LiveCounterSection } from '@/components/landing/LiveCounterSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import logo from '@/assets/logo.png';
import heroSlide1 from '@/assets/hero-slide-1.jpg';
import heroSlide2 from '@/assets/hero-slide-2.jpg';
import heroSlide3 from '@/assets/hero-slide-3.jpg';
import serviceGrocery from '@/assets/service-grocery.jpg';
import vendorImg from '@/assets/vendor-illustration.png';
import driverImg from '@/assets/driver-illustration.png';
import featureFast from '@/assets/feature-fast.jpg';
import featureQuality from '@/assets/feature-quality.jpg';
import featureTracking from '@/assets/feature-tracking.jpg';
import featureLocal from '@/assets/feature-local.jpg';
import featureEco from '@/assets/feature-eco.jpg';
import featureSupport from '@/assets/feature-support.jpg';
import { useState, useEffect, useCallback } from 'react';

const heroSlides = [
  { image: heroSlide1, subtitle: 'Farm Fresh Produce', title: 'Freshness delivered to your', highlight: 'doorstep.' },
  { image: heroSlide2, subtitle: 'Lightning Fast Delivery', title: 'Your groceries in', highlight: '20 minutes.' },
  { image: heroSlide3, subtitle: 'Happy Families', title: 'Trusted by thousands of', highlight: 'families.' },
];

const services = [
  { image: serviceGrocery, title: 'Fresh Grocery', description: 'Farm-to-table produce and organic essentials picked daily for your kitchen.', cta: 'BROWSE AISLES' },
  { image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop', title: 'Fashion', description: 'Trendy clothing, shoes and accessories delivered to your doorstep.', cta: 'SHOP STYLE' },
  { image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=600&fit=crop', title: 'Medicine', description: 'Pharmacy essentials and over-the-counter meds when you need them most.', cta: 'ORDER MEDS' },
  { image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', title: 'Restaurant', description: 'Hot meals from your favorite local restaurants, fast and fresh.', cta: 'ORDER FOOD' },
  { image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&h=600&fit=crop', title: 'Drinks & Sodas', description: 'Coca-Cola, juices, water and energy drinks — chilled and ready.', cta: 'GRAB A DRINK' },
  { image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop', title: 'Electronics', description: 'Phones, chargers, accessories and gadgets at great prices.', cta: 'SHOP TECH' },
];

const whyUs = [
  { image: featureFast, title: 'Ultra-Fast Delivery', desc: 'Average delivery under 20 minutes across Nairobi.' },
  { image: featureQuality, title: 'Quality Guaranteed', desc: 'Every item inspected before it reaches your door.' },
  { image: featureTracking, title: 'Real-Time Tracking', desc: 'Track your order live from store to doorstep.' },
  { image: featureLocal, title: 'Local Partners', desc: 'Supporting Kenyan farmers, vendors & businesses.' },
  { image: featureEco, title: 'Eco-Friendly', desc: 'Sustainable packaging and green delivery routes.' },
  { image: featureSupport, title: '24/7 Support', desc: 'Our team is always here to help, day or night.' },
];

const navLinks = ['Grocery', 'Partner'];

// Social media SVG icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 10000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const slide = heroSlides[currentSlide];

  // Theme-aware colors
  const bg = isDark ? 'bg-[hsl(150,30%,6%)]' : 'bg-[hsl(140,20%,97%)]';
  const bgAlt = isDark ? 'bg-[hsl(150,25%,5%)]' : 'bg-[hsl(140,15%,94%)]';
  const textPrimary = isDark ? 'text-[hsl(0,0%,95%)]' : 'text-[hsl(150,30%,10%)]';
  const textSecondary = isDark ? 'text-[hsl(0,0%,70%)]' : 'text-[hsl(150,10%,40%)]';
  const textMuted = isDark ? 'text-[hsl(0,0%,50%)]' : 'text-[hsl(150,10%,55%)]';
  const cardBg = isDark ? 'bg-[hsl(150,20%,10%)]' : 'bg-white';
  const cardBorder = isDark ? 'border-[hsl(150,15%,16%)]' : 'border-[hsl(140,15%,88%)]';
  const navBg = isDark ? 'bg-[hsl(150,30%,6%)]/95' : 'bg-[hsl(140,20%,97%)]/95';
  const navBorder = isDark ? 'border-[hsl(150,15%,15%)]' : 'border-[hsl(140,15%,88%)]';
  const inputBg = isDark ? 'bg-[hsl(150,20%,12%)]' : 'bg-white';
  const inputBorder = isDark ? 'border-[hsl(150,15%,18%)]' : 'border-[hsl(140,15%,85%)]';
  const socialBg = isDark ? 'bg-[hsl(150,20%,12%)]' : 'bg-[hsl(140,15%,92%)]';
  const featureBg = isDark ? 'bg-[hsl(150,20%,9%)]' : 'bg-white';
  const featureBorder = isDark ? 'border-[hsl(150,15%,14%)]' : 'border-[hsl(140,15%,88%)]';
  const heroOverlay = isDark
    ? 'bg-gradient-to-r from-[hsl(150,30%,6%)] via-[hsl(150,30%,6%)]/85 to-[hsl(150,30%,6%)]/50'
    : 'bg-gradient-to-r from-[hsl(140,20%,97%)] via-[hsl(140,20%,97%)]/90 to-[hsl(140,20%,97%)]/60';

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} overflow-x-hidden`}>
      {/* ─── Navbar ─── */}
      <nav className={`flex items-center justify-between px-6 md:px-16 py-3 border-b ${navBorder} sticky top-0 z-50 ${navBg}`}>
        <div className="flex items-center gap-2">
          <img src={logo} alt="HALLOFRESH" className="h-10 w-10 object-contain" />
          <span className="font-extrabold text-lg tracking-tight hidden sm:inline">HALLO FRESH MARKET</span>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <button key={l} className={`text-sm ${textSecondary} hover:text-primary transition-colors`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-10 h-10 rounded-full ${socialBg} flex items-center justify-center ${textSecondary} hover:text-primary transition-all duration-300`}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              <motion.div key={isDark ? 'dark' : 'light'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.div>
            </AnimatePresence>
          </button>
          <Button variant="ghost" className={`text-sm ${textSecondary} hover:text-primary hidden sm:inline-flex`} onClick={() => navigate('/auth')}>Login</Button>
          <Button className="rounded-full text-sm font-semibold px-5 hidden sm:inline-flex" onClick={() => navigate('/auth')}>Get Started</Button>
          {/* Mobile menu */}
          <button className="lg:hidden w-10 h-10 flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`${cardBg} border-b ${navBorder} overflow-hidden lg:hidden sticky top-[57px] z-40`}
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((l) => (
                <button key={l} className={`block text-sm ${textSecondary} hover:text-primary transition-colors`}>{l}</button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Login</Button>
                <Button className="flex-1" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Hero with Slideshow ─── */}
      <section className="relative min-h-[85vh] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 z-0">
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 ${heroOverlay} `} />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 w-full px-6 md:px-16 py-20">
          <div className="max-w-2xl">
            <motion.span key={`sub-${currentSlide}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-primary/20 text-primary text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
              {slide.subtitle}
            </motion.span>

            <AnimatePresence mode="wait">
              <motion.h1 key={`title-${currentSlide}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6">
                {slide.title}<br /><span className="text-primary">{slide.highlight}</span>
              </motion.h1>
            </AnimatePresence>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`${textSecondary} text-lg max-w-xl mb-10`}>
              Experience the premium way to get your essentials. From gourmet meals to daily groceries, delivered in minutes.
            </motion.p>

            <div className={`flex w-full max-w-lg ${inputBg} rounded-2xl p-1.5 border ${inputBorder} shadow-lg `}>
              <div className="flex items-center gap-2 flex-1 px-4">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <input type="text" placeholder="Enter your delivery address" value={address} onChange={(e) => setAddress(e.target.value)}
                  className={`bg-transparent text-sm w-full outline-none ${textMuted} placeholder:${textMuted}`} />
              </div>
              <Button className="rounded-xl px-6 font-semibold" onClick={() => navigate('/auth')}>Find Grocery</Button>
            </div>

            <div className={`flex items-center gap-6 mt-6 text-xs ${textMuted}`}>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Top-rated drivers</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> 20 min avg. delivery</span>
            </div>
          </div>

          <div className="flex gap-2 mt-10">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-primary' : `w-3 ${isDark ? 'bg-[hsl(150,15%,25%)]' : 'bg-[hsl(140,15%,75%)]'}`}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <LiveCounterSection isDark={isDark} bgAlt={bgAlt} navBorder={navBorder} textMuted={textMuted} />

      {/* ─── Premium Services with Images ─── */}
      <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Our Premium Services</h2>
            <p className={`${textMuted} max-w-lg`}>A unified ecosystem for all your daily needs, handled with boutique care and precision.</p>
          </div>
          <button className="text-primary text-sm font-semibold mt-4 md:mt-0 flex items-center gap-1 hover:gap-2 transition-all">
            Explore all services <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {services.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`${cardBg} border ${cardBorder} rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col sm:flex-row`}>
              <div className="relative h-48 sm:h-auto sm:w-1/2 overflow-hidden">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 to-transparent" />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center sm:w-1/2">
                <h3 className="font-bold text-xl mb-2">{s.title}</h3>
                <p className={`text-sm ${textMuted} mb-4 leading-relaxed`}>{s.description}</p>
                <button className="text-primary text-xs font-bold tracking-wide flex items-center gap-1 hover:gap-2 transition-all">
                  {s.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <HowItWorksSection isDark={isDark} textMuted={textMuted} cardBg={cardBg} cardBorder={cardBorder} />

      {/* ─── Why Choose Us ─── */}
      <section className={`px-6 md:px-16 py-20 ${bgAlt} `}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose HALLOFRESH?</h2>
          <p className={`${textMuted} max-w-lg mx-auto`}>More than just delivery — we're building the future of how Nairobi shops.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {whyUs.map((w, i) => (
            <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl ${featureBg} border ${featureBorder} overflow-hidden hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group`}>
              <div className="relative h-40 overflow-hidden">
                <img src={w.image} alt={w.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-5">
                <h4 className="font-semibold mb-1">{w.title}</h4>
                <p className={`text-sm ${textMuted} leading-relaxed`}>{w.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Download App Section ─── */}
      <section className="px-6 md:px-16 py-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <Smartphone className="h-3.5 w-3.5" /> MOBILE APP
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get the HALLOFRESH App</h2>
            <p className={`${textMuted} mb-8 max-w-md`}>Download our app for the best experience. Order groceries, track deliveries, and unlock exclusive deals — all from your phone.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl px-5 py-3 hover:opacity-90 transition-opacity`}>
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left"><p className="text-[10px] uppercase opacity-70 leading-tight">Download on the</p><p className="text-base font-semibold leading-tight">App Store</p></div>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} rounded-xl px-5 py-3 hover:opacity-90 transition-opacity`}>
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.6l2.651 1.535a1 1 0 010 1.716l-2.651 1.535-2.535-2.535 2.535-2.251zM5.864 2.658L16.8 8.991l-2.302 2.302L5.864 2.658z"/></svg>
                <div className="text-left"><p className="text-[10px] uppercase opacity-70 leading-tight">Get it on</p><p className="text-base font-semibold leading-tight">Google Play</p></div>
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 flex justify-center">
            <div className="relative">
              {/* Phone mockup */}
              <div className={`w-64 h-[520px] rounded-[3rem] border-4 ${isDark ? 'border-[hsl(150,15%,25%)]' : 'border-[hsl(140,15%,80%)]'} ${cardBg} shadow-2xl overflow-hidden `}>
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
                  <img src={logo} alt="HALLOFRESH" className="h-20 w-20 object-contain mb-4" />
                  <h3 className="font-bold text-lg mb-2">HALLOFRESH</h3>
                  <p className={`text-xs ${textMuted} mb-6`}>Fresh groceries delivered to your doorstep in minutes</p>
                  <Button className="rounded-full text-sm px-6" size="sm" onClick={() => navigate('/auth')}>Order Now</Button>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                🔔 Order delivered!
              </div>
              <div className="absolute -bottom-2 -left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg">
                🥬 50% off veggies
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Grow with HALLOFRESH ─── */}
      <section className={`px-6 md:px-16 py-20 ${bgAlt} `}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Grow with HALLOFRESH</h2>
          <p className={`${textMuted} max-w-lg mx-auto`}>Join our ecosystem as a vendor or driver and scale your reach with our sophisticated logistics platform.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative bg-gradient-to-br from-[hsl(150,30%,14%)] to-[hsl(150,25%,10%)] rounded-3xl overflow-hidden min-h-[320px] flex flex-col justify-end p-8">
            <img src={vendorImg} alt="Vendor" className="absolute right-0 top-0 h-full w-1/2 object-contain object-right-bottom opacity-80" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-white">Register as a Vendor</h3>
              <p className="text-sm text-[hsl(0,0%,65%)] mb-4 max-w-[220px]">Expand your business and reach thousands of local customers.</p>
              <Button className="rounded-xl font-semibold" onClick={() => navigate('/auth')}>Start Selling</Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative bg-gradient-to-br from-[hsl(150,30%,14%)] to-[hsl(150,25%,10%)] rounded-3xl overflow-hidden min-h-[320px] flex flex-col justify-end p-8">
            <img src={driverImg} alt="Driver" className="absolute right-0 top-0 h-full w-1/2 object-contain object-right-bottom opacity-80" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 text-white">Become a Driver</h3>
              <p className="text-sm text-[hsl(0,0%,65%)] mb-4 max-w-[220px]">Enjoy flexible hours, competitive earnings, and premium support.</p>
              <Button className="rounded-xl font-semibold" onClick={() => navigate('/auth')}>Apply to Drive</Button>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ─── Testimonials ─── */}
      <TestimonialsSection isDark={isDark} textMuted={textMuted} textSecondary={textSecondary} cardBg={cardBg} cardBorder={cardBorder} />

      {/* ─── Footer ─── */}
      <footer className={`${bgAlt} border-t ${navBorder} px-6 md:px-16 py-14 `}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="HALLO FRESH MARKET" className="h-9 w-9 object-contain" />
              <span className="font-extrabold text-lg">HALLO FRESH MARKET</span>
            </div>
            <p className={`text-sm ${textMuted} leading-relaxed mb-4`}>
              Elevating daily living through premium delivery services. We connect you with the best of your city.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-2">
              {[
                { Icon: FacebookIcon, href: 'https://facebook.com' },
                { Icon: TwitterXIcon, href: 'https://twitter.com' },
                { Icon: InstagramIcon, href: 'https://instagram.com' },
                { Icon: TikTokIcon, href: 'https://tiktok.com' },
                { Icon: LinkedInIcon, href: 'https://linkedin.com' },
              ].map(({ Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full ${socialBg} flex items-center justify-center ${textMuted} hover:text-primary hover:bg-primary/10 transition-all duration-300`}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className={`space-y-2 text-sm ${textMuted}`}>
              {['About Us', 'Our Services', 'Become a Partner', 'Support Center', 'Gift Cards'].map((l) => (
                <li key={l}><button className="hover:text-primary transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className={`space-y-2 text-sm ${textMuted}`}>
              {['Help Center', 'Safety Guidelines', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((l) => (
                <li key={l}><button className="hover:text-primary transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Get the App</h4>
            <div className="space-y-3">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 ${socialBg} hover:bg-primary/10 rounded-xl px-4 py-3 transition-colors`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left"><p className="text-[10px] uppercase opacity-60">Download on the</p><p className="text-sm font-semibold">App Store</p></div>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 ${socialBg} hover:bg-primary/10 rounded-xl px-4 py-3 transition-colors`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.6l2.651 1.535a1 1 0 010 1.716l-2.651 1.535-2.535-2.535 2.535-2.251zM5.864 2.658L16.8 8.991l-2.302 2.302L5.864 2.658z"/></svg>
                <div className="text-left"><p className="text-[10px] uppercase opacity-60">Get it on</p><p className="text-sm font-semibold">Google Play</p></div>
              </a>
            </div>
          </div>
        </div>
        <div className={`border-t ${navBorder} pt-6 flex flex-col md:flex-row items-center justify-between text-xs ${textMuted} max-w-7xl mx-auto`}>
          <p>© 2026 HALLO FRESH MARKET. All rights reserved.</p>
          <div className="flex gap-4 mt-3 md:mt-0">
            <span>English (US)</span>
            <span>KES (KSh)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
