import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { GuestGate } from '@/components/store/GuestGate';
import { SearchBar } from '@/components/store/SearchBar';
import { ServiceTiles } from '@/components/store/ServiceTiles';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { AddressSection } from '@/components/store/AddressSection';
import { DiscoveryCategories } from '@/components/store/DiscoveryCategories';
import { PromoBanners } from '@/components/store/PromoBanners';
import { PopularNearby } from '@/components/store/PopularNearby';

import { LocationPickerSheet, getSavedLocation } from '@/components/store/LocationPickerSheet';
import { LocationPermissionScreen } from '@/components/store/LocationPermissionScreen';
import { BranchSelector } from '@/components/store/BranchSelector';
import { BottomNav } from '@/components/store/BottomNav';
import { FloatingCart } from '@/components/store/FloatingCart';
import { CartDrawer } from '@/components/store/CartDrawer';
import { UserMenu } from '@/components/store/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { toast } from 'sonner';
import { Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


const LOCATION_STORAGE_KEY = 'delivery_location';

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"
    >
      {isDark ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-foreground" />}
    </button>
  );
}

const GUEST_BROWSING_KEY = 'guest_browsing';

const Index = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('Eastleigh, Muratina Road');
  const [currentCity, setCurrentCity] = useState('Eastleigh');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGuestBrowsing, setIsGuestBrowsing] = useState(() =>
    sessionStorage.getItem(GUEST_BROWSING_KEY) === 'true'
  );





  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setDeliveryLocation(saved.address);
      setCurrentCity(saved.city);
      if (saved.lat && saved.lng) setUserCoords({ lat: saved.lat, lng: saved.lng });
    } else if (user) {
      setShowPermissionScreen(true);
    }
  }, [user]);

  const handleLocationDetect = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setShowPermissionScreen(false);
      setIsLocationOpen(true);
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const addr = data.address || {};
          const parts: string[] = [];
          if (addr.building || addr.amenity || addr.shop) parts.push(addr.building || addr.amenity || addr.shop);
          if (addr.house_number && addr.road) parts.push(`${addr.house_number} ${addr.road}`);
          else if (addr.road) parts.push(addr.road);
          if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
          if (addr.city || addr.town || addr.county) parts.push(addr.city || addr.town || addr.county);

          const exactAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || 'Your Location');
          const city = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || 'Nairobi';

          const location = { address: exactAddress, city, lat: latitude, lng: longitude };
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
          setDeliveryLocation(exactAddress);
          setCurrentCity(city);
          setUserCoords({ lat: latitude, lng: longitude });
          toast.success(`Location detected: ${exactAddress}`);

          // Auto-save to delivery_addresses so admin can see it
          if (user) {
            const { data: existing } = await supabase
              .from('delivery_addresses')
              .select('id')
              .eq('user_id', user.id)
              .eq('label', 'Home')
              .maybeSingle();

            if (existing) {
              await supabase
                .from('delivery_addresses')
                .update({
                  address_line: exactAddress,
                  city,
                  latitude,
                  longitude,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
            } else {
              await supabase
                .from('delivery_addresses')
                .insert({
                  user_id: user.id,
                  label: 'Home',
                  address_line: exactAddress,
                  city,
                  latitude,
                  longitude,
                  is_default: true,
                });
            }
          }
        } catch {
          setDeliveryLocation(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast.info('Location detected. You can refine it manually.');
        }
        setIsDetectingLocation(false);
        setShowPermissionScreen(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error(error.code === error.PERMISSION_DENIED
          ? 'Location access denied. Please select your area manually.'
          : 'Could not detect location. Please select manually.');
        setIsDetectingLocation(false);
        setShowPermissionScreen(false);
        setIsLocationOpen(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [user]);

  const handleLocationSelect = async (location: { address: string; city: string; lat: number; lng: number }) => {
    setDeliveryLocation(location.address);
    setCurrentCity(location.city);
    setUserCoords({ lat: location.lat, lng: location.lng });
    setIsLocationOpen(false);

    // Also save to delivery_addresses so admin can see it
    if (user) {
      const { data: existing } = await supabase
        .from('delivery_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('label', 'Home')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('delivery_addresses')
          .update({
            address_line: location.address,
            city: location.city,
            latitude: location.lat,
            longitude: location.lng,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('delivery_addresses')
          .insert({
            user_id: user.id,
            label: 'Home',
            address_line: location.address,
            city: location.city,
            latitude: location.lat,
            longitude: location.lng,
            is_default: true,
          });
      }
    }
  };

  // Show gate if not logged in and hasn't chosen to browse
  if (!user && !isGuestBrowsing) {
    return (
      <GuestGate onBrowse={() => {
        sessionStorage.setItem(GUEST_BROWSING_KEY, 'true');
        setIsGuestBrowsing(true);
      }} />
    );
  }

  return (
    <CartProvider>
      <AnimatePresence>
        {showPermissionScreen && (
          <LocationPermissionScreen
            onAllow={handleLocationDetect}
            onSkip={() => { setShowPermissionScreen(false); setIsLocationOpen(true); }}
            isLoading={isDetectingLocation}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background pb-24">
        {/* Top bar: theme toggle + search + notification */}
        <header className="flex items-center gap-2 px-4 pt-4 pb-2">
          <ThemeToggle />
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={(val) => { setSearchQuery(val); if (val) setSelectedCategory(null); }}
              placeholder={t('searchRestaurants')}
              showFilter={false}
            />
          </div>
          <UserMenu />
        </header>

        <main className="space-y-6 pt-2">
          {!searchQuery && (
            <>
              {/* Service Tiles / Category Banner */}
              <ServiceTiles
                onCategorySelect={setSelectedCategory}
                selectedCategory={selectedCategory}
              />

              {/* Hero Carousel */}
              <HeroCarousel />

              {/* Address Section */}
              <AddressSection
                location={deliveryLocation}
                onManageClick={() => setIsLocationOpen(true)}
              />

              {/* Branch Selector Dropdown */}
              <BranchSelector userLat={userCoords?.lat ?? null} userLng={userCoords?.lng ?? null} />

              {/* Promo Banners */}
              <PromoBanners />

              {/* Discovery Categories */}
              <DiscoveryCategories
                onCategorySelect={setSelectedCategory}
                selectedCategory={selectedCategory}
              />
            </>
          )}

          {/* Products */}
          <PopularNearby searchQuery={searchQuery} category={selectedCategory} />
        </main>

        <FloatingCart />
        <CartDrawer />
        <BottomNav />
        
        <LocationPickerSheet
          isOpen={isLocationOpen}
          onClose={() => setIsLocationOpen(false)}
          onLocationSelect={handleLocationSelect}
          currentCity={currentCity}
        />
      </div>
    </CartProvider>
  );
};

export default Index;
