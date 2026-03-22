import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-vegetables.jpg';

const slides = [
  {
    image: heroImage,
    title: 'Freshness at your doorstep',
    description: "Shop the nation's best organic farms and get healthy groceries delivered straight to your home.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide] = useState(0);

  const handleGetStarted = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Dispatch custom event to notify App component
    window.dispatchEvent(new Event('onboarding-complete'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col"
        >
          {/* Hero Image */}
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative h-[55vh] overflow-hidden"
          >
            <img
              src={slides[currentSlide].image}
              alt="Fresh vegetables"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </motion.div>

          {/* Content Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex-1 bg-background rounded-t-[2rem] -mt-8 relative z-10 px-6 py-8 flex flex-col"
          >
            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4"
            >
              {slides[currentSlide].title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-center mb-8 max-w-sm mx-auto"
            >
              {slides[currentSlide].description}
            </motion.p>

            {/* Get Started Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-auto"
            >
              <Button
                onClick={handleGetStarted}
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-button"
                size="lg"
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
