import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Store, Clock, ShieldCheck, Heart, Zap, Users, Phone, MapPin, Star, Package, RefreshCw, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl p-5 shadow-card"
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function BulletItem({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-primary to-primary/80 px-5 pt-12 pb-10"
      >
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-6 w-6 text-primary-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-primary-foreground">About Us</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Learn more about HalloFresh Grocery Mart</p>
      </motion.div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 1. Welcome */}
        <SectionCard delay={0.05}>
          <SectionTitle icon={Store} title="Welcome to HalloFresh Grocery Mart" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            HalloFresh Grocery Mart is your trusted neighbourhood grocery delivery platform based in Eastleigh, Muratina Road, Nairobi. We bring the freshest fruits, vegetables, dairy, household essentials, and more right to your doorstep — fast, affordable, and hassle-free. Whether you're a busy professional, a parent, or simply someone who values convenience, HalloFresh is here to make grocery shopping effortless.
          </p>
        </SectionCard>

        {/* 2. Our Mission */}
        <SectionCard delay={0.1}>
          <SectionTitle icon={Target} title="Our Mission" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            To revolutionise grocery shopping in Nairobi by providing a seamless, technology-driven delivery experience that saves time, guarantees freshness, and supports local vendors — making quality groceries accessible to every household.
          </p>
        </SectionCard>

        {/* 3. Our Vision */}
        <SectionCard delay={0.15}>
          <SectionTitle icon={Star} title="Our Vision" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            To become East Africa's most loved and reliable grocery delivery platform — known for speed, quality, and an unwavering commitment to customer satisfaction. We envision a future where no one has to worry about the time or effort of grocery shopping.
          </p>
        </SectionCard>

        {/* 4. What We Do */}
        <SectionCard delay={0.2}>
          <SectionTitle icon={Package} title="What We Do" />
          <div className="space-y-1">
            <BulletItem
              icon={Truck}
              title="Fast Deliveries"
              desc="We deliver fresh groceries to your doorstep within Eastleigh and surrounding areas in record time. Our riders are dispatched immediately after order confirmation so your items arrive while they're still at their freshest."
            />
            <BulletItem
              icon={Store}
              title="Vendor Solutions"
              desc="We partner with local vendors and suppliers, giving them a digital storefront to reach more customers. If you're a vendor, HalloFresh helps you grow your business by connecting you directly with buyers in the community."
            />
            <BulletItem
              icon={Clock}
              title="Flexible Delivery Operations"
              desc="Choose your preferred delivery window, schedule orders in advance, or opt for instant delivery. Our system adapts to your schedule, not the other way around. We operate flexible hours to suit your lifestyle."
            />
          </div>
        </SectionCard>

        {/* 5. Why Choose HalloFresh? */}
        <SectionCard delay={0.25}>
          <SectionTitle icon={ShieldCheck} title="Why Choose HalloFresh?" />
          <div className="space-y-1">
            <BulletItem icon={Zap} title="Lightning-Fast Delivery" desc="Get your groceries in as little as 30 minutes within Eastleigh." />
            <BulletItem icon={ShieldCheck} title="Quality Guaranteed" desc="Every product is hand-picked and checked for freshness before dispatch." />
            <BulletItem icon={Heart} title="Affordable Prices" desc="Competitive market prices with regular deals, discounts, and weekly offers." />
            <BulletItem icon={Phone} title="24/7 Support" desc="Our customer support team and live chat are always available to help you." />
            <BulletItem icon={RefreshCw} title="Easy Returns & Refunds" desc="Not satisfied? Contact us and we'll make it right — no questions asked." />
          </div>
        </SectionCard>

        {/* 6. How It Works */}
        <SectionCard delay={0.3}>
          <SectionTitle icon={Zap} title="How It Works" />
          <div className="space-y-3">
            {[
              { step: '1', title: 'Browse & Add to Cart', desc: 'Explore our wide range of products by category and add items to your cart.' },
              { step: '2', title: 'Place Your Order', desc: 'Choose your delivery address, select a payment method (M-Pesa supported), and confirm.' },
              { step: '3', title: 'We Pick & Pack', desc: 'Our team carefully selects and packs your order to ensure freshness and quality.' },
              { step: '4', title: 'Fast Delivery', desc: 'A rider picks up your order and delivers it to your doorstep in minutes.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold text-sm">{item.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 7. Our Core Values */}
        <SectionCard delay={0.35}>
          <SectionTitle icon={Heart} title="Our Core Values" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, label: 'Integrity', desc: 'Honest pricing, transparent operations.' },
              { icon: Zap, label: 'Speed', desc: 'We value your time above all.' },
              { icon: Heart, label: 'Care', desc: 'Every order is handled with love.' },
              { icon: Users, label: 'Community', desc: 'Supporting local vendors & riders.' },
              { icon: Star, label: 'Excellence', desc: 'We strive for the best, always.' },
              { icon: RefreshCw, label: 'Innovation', desc: 'Constantly improving your experience.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                <Icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-muted-foreground text-xs leading-tight mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 8. Join Us on the Journey */}
        <SectionCard delay={0.4}>
          <SectionTitle icon={Users} title="Join Us on the Journey" />
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            HalloFresh is more than a grocery app — it's a movement to make everyday life easier for families and individuals across Nairobi. Whether you want to shop smarter, partner as a vendor, or ride with us as a delivery partner, there's a place for you at HalloFresh.
          </p>
          <div className="bg-primary/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href="tel:+254719482565" className="text-foreground font-semibold text-sm">+254 719 482 565</a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground text-sm">Eastleigh, Muratina Road, Nairobi</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
