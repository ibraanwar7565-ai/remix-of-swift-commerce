import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { MapPin, Search, Navigation, ArrowLeft, Check, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import nboWestlands from '@/assets/nairobi-westlands.jpg';
import nboKaren from '@/assets/nairobi-karen.jpg';
import nboKilimani from '@/assets/nairobi-kilimani.jpg';
import nboLavington from '@/assets/nairobi-lavington.jpg';
import nboCbd from '@/assets/nairobi-cbd.jpg';
import nboEastleigh from '@/assets/nairobi-eastleigh.jpg';
import nboLangata from '@/assets/nairobi-langata.jpg';
import nboParklands from '@/assets/nairobi-parklands.jpg';

// Nairobi neighborhoods with coordinates
const nairobiAreas = [
  { name: 'Westlands', region: 'Nairobi', lat: -1.2673, lng: 36.8110, image: nboWestlands },
  { name: 'Karen', region: 'Nairobi', lat: -1.3197, lng: 36.7112, image: nboKaren },
  { name: 'Kilimani', region: 'Nairobi', lat: -1.2890, lng: 36.7850, image: nboKilimani },
  { name: 'Lavington', region: 'Nairobi', lat: -1.2780, lng: 36.7680, image: nboLavington },
  { name: 'Kileleshwa', region: 'Nairobi', lat: -1.2750, lng: 36.7780, image: nboKilimani },
  { name: 'Parklands', region: 'Nairobi', lat: -1.2620, lng: 36.8180, image: nboParklands },
  { name: 'Ngong Road', region: 'Nairobi', lat: -1.3000, lng: 36.7600, image: nboLavington },
  { name: 'Upper Hill', region: 'Nairobi', lat: -1.2950, lng: 36.8150, image: nboCbd },
  { name: 'CBD', region: 'Nairobi', lat: -1.2864, lng: 36.8172, image: nboCbd },
  { name: 'South B', region: 'Nairobi', lat: -1.3100, lng: 36.8350, image: nboEastleigh },
  { name: 'South C', region: 'Nairobi', lat: -1.3150, lng: 36.8250, image: nboEastleigh },
  { name: 'Eastleigh', region: 'Nairobi', lat: -1.2750, lng: 36.8500, image: nboEastleigh },
  { name: 'Langata', region: 'Nairobi', lat: -1.3650, lng: 36.7350, image: nboLangata },
  { name: 'Embakasi', region: 'Nairobi', lat: -1.3230, lng: 36.9100, image: nboCbd },
  { name: 'Kasarani', region: 'Nairobi', lat: -1.2220, lng: 36.9010, image: nboWestlands },
  { name: 'Roysambu', region: 'Nairobi', lat: -1.2180, lng: 36.8780, image: nboParklands },
  { name: 'Ruaka', region: 'Nairobi', lat: -1.2100, lng: 36.7800, image: nboKaren },
  { name: 'Gigiri', region: 'Nairobi', lat: -1.2350, lng: 36.8050, image: nboLangata },
  { name: 'Runda', region: 'Nairobi', lat: -1.2150, lng: 36.8100, image: nboKaren },
  { name: 'Donholm', region: 'Nairobi', lat: -1.2950, lng: 36.8800, image: nboEastleigh },
];

const LOCATION_STORAGE_KEY = 'delivery_location';

interface LocationPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; city: string; lat: number; lng: number }) => void;
  currentCity?: string;
}

export function LocationPickerSheet({ isOpen, onClose, onLocationSelect, currentCity }: LocationPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [buildingInput, setBuildingInput] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number; city: string } | null>(null);

  // Auto-detect location when sheet opens
  useEffect(() => {
    if (isOpen) {
      handleUseCurrentLocation();
    }
  }, [isOpen]);

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return nairobiAreas;
    const query = searchQuery.toLowerCase();
    return nairobiAreas.filter(
      area => 
        area.name.toLowerCase().includes(query) || 
        area.region.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleAreaSelect = (area: typeof nairobiAreas[0]) => {
    const location = {
      address: `${area.name}, Nairobi`,
      city: area.name,
      lat: area.lat,
      lng: area.lng,
    };
    
    // Persist to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    
    onLocationSelect(location);
    toast.success(`Delivery location set to ${area.name}, Nairobi`);
  };

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    
    // Check permission status first
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        toast.error('Location access denied. Please enable location in your browser settings.');
        setIsGettingLocation(false);
        return;
      }
    } catch {
      // Some browsers don't support permissions API, continue anyway
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode using OpenStreetMap Nominatim for exact address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          
          const addr = data.address || {};
          // Build a detailed address string
          const parts: string[] = [];
          if (addr.building || addr.amenity || addr.shop) parts.push(addr.building || addr.amenity || addr.shop);
          if (addr.house_number && addr.road) parts.push(`${addr.house_number} ${addr.road}`);
          else if (addr.road) parts.push(addr.road);
          if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
          if (addr.city || addr.town || addr.county) parts.push(addr.city || addr.town || addr.county);
          
          const exactAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || 'Your Location');
          const city = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || 'Nairobi';
          
          setDetectedAddress(exactAddress);
          setDetectedCoords({ lat: latitude, lng: longitude, city });
          setBuildingInput('');
          
          const location = { address: exactAddress, city, lat: latitude, lng: longitude };
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
          onLocationSelect(location);
          toast.success(`Location detected: ${exactAddress}`);
          setIsGettingLocation(false);
        } catch {
          // Fallback to nearest area if reverse geocoding fails
          let nearestArea = nairobiAreas[0];
          let minDistance = Infinity;
          nairobiAreas.forEach(area => {
            const distance = Math.sqrt(
              Math.pow(area.lat - latitude, 2) + Math.pow(area.lng - longitude, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearestArea = area;
            }
          });

          const location = {
            address: `${nearestArea.name}, Nairobi`,
            city: nearestArea.name,
            lat: latitude,
            lng: longitude,
          };
          
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
          onLocationSelect(location);
          toast.success(`Location detected: ${nearestArea.name}, Nairobi`);
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please try again or select a city.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [onLocationSelect]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <SheetTitle className="text-lg font-bold">
                Select Delivery Location
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search city or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 rounded-2xl bg-secondary border-0"
              />
            </div>
          </div>

          {/* Use Current Location */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="mx-4 p-4 bg-accent rounded-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground">
                {isGettingLocation ? 'Getting location...' : 'Use current location'}
              </p>
              <p className="text-sm text-muted-foreground">
                Enable GPS for better results
              </p>
            </div>
          </motion.button>

          {/* Detected address + building input */}
          {detectedAddress && detectedCoords && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mx-4 mt-3 p-4 bg-secondary rounded-2xl space-y-3"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{detectedAddress}</p>
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Building name, floor, apt number..."
                  value={buildingInput}
                  onChange={(e) => setBuildingInput(e.target.value)}
                  className="h-10 pl-10 rounded-xl bg-background border-border text-sm"
                />
              </div>
              {buildingInput.trim() && (
                <Button
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => {
                    const fullAddress = `${buildingInput.trim()}, ${detectedAddress}`;
                    const location = {
                      address: fullAddress,
                      city: detectedCoords.city,
                      lat: detectedCoords.lat,
                      lng: detectedCoords.lng,
                    };
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
                    onLocationSelect(location);
                    toast.success(`Address updated: ${fullAddress}`);
                    onClose();
                  }}
                >
                  Confirm: {buildingInput.trim()}, {detectedAddress.split(',')[0]}
                </Button>
              )}
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {searchQuery ? `${filteredAreas.length} results` : 'Nairobi Areas'}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Cities Grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredAreas.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No areas found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredAreas.map((area, index) => {
                  const isSelected = currentCity === area.name;
                  return (
                    <motion.button
                      key={area.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAreaSelect(area)}
                      className={`relative rounded-2xl overflow-hidden aspect-[4/3] group ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={area.image}
                        alt={area.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-left">
                        <p className="font-bold text-white flex items-center gap-1">
                          {area.name}
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </p>
                        <p className="text-xs text-white/70">{area.region}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper to get saved location
export function getSavedLocation(): { address: string; city: string; lat: number; lng: number } | null {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
