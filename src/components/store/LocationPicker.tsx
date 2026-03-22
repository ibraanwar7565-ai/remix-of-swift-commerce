/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => void;
  initialLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Default to Nairobi if no initial location
  const defaultCenter = initialLocation || { lat: -1.2921, lng: 36.8219 };

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#2D5A3D',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Update address when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        reverseGeocode(position.lat(), position.lng());
      }
    });

    // Update marker when map is clicked
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      }
    });

    setIsLoading(false);

    // Reverse geocode initial location
    if (initialLocation && !initialLocation.address) {
      reverseGeocode(initialLocation.lat, initialLocation.lng);
    }
  }, [defaultCenter, initialLocation]);

  useEffect(() => {
    // Check if Google Maps API key is configured
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapError('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.');
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        setMapError('Failed to load Google Maps. Please check your API key.');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [initializeMap]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        const address = response.results[0].formatted_address;
        const city = response.results[0].address_components.find(
          c => c.types.includes('locality') || c.types.includes('administrative_area_level_1')
        )?.long_name || '';
        
        setSelectedAddress(address);
        onLocationSelect({ address, city, lat, lng });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({ address: searchQuery });
      if (response.results[0]) {
        const location = response.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        mapInstanceRef.current?.setCenter({ lat, lng });
        markerRef.current?.setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstanceRef.current?.setCenter({ lat: latitude, lng: longitude });
        markerRef.current?.setPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        setIsLoading(false);
      },
      () => {
        toast.error('Unable to get your location');
        setIsLoading(false);
      }
    );
  };

  if (mapError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-secondary/50 p-6 text-center"
      >
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{mapError}</p>
        <div className="space-y-2">
          <Label htmlFor="manualAddress">Enter your delivery address</Label>
          <Input
            id="manualAddress"
            placeholder="e.g., 123 Kenyatta Avenue, Nairobi"
            value={selectedAddress}
            onChange={(e) => {
              setSelectedAddress(e.target.value);
              onLocationSelect({
                address: e.target.value,
                city: 'Nairobi',
                lat: -1.2921,
                lng: 36.8219,
              });
            }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for your location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={getCurrentLocation}
          title="Use my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <div 
        ref={mapRef} 
        className="h-64 rounded-lg border border-border overflow-hidden bg-muted"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {selectedAddress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-secondary"
        >
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">{selectedAddress}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
