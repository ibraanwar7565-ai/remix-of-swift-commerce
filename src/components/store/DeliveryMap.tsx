import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  storeLat?: number;
  storeLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  riderLat?: number;
  riderLng?: number;
  className?: string;
}

// Nairobi center defaults
const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

export function DeliveryMap({
  storeLat = NAIROBI_CENTER.lat,
  storeLng = NAIROBI_CENTER.lng,
  deliveryLat,
  deliveryLng,
  riderLat,
  riderLng,
  className = '',
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [deliveryLat || NAIROBI_CENTER.lat, deliveryLng || NAIROBI_CENTER.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds: L.LatLngExpression[] = [];

    // Store marker
    const storeIcon = L.divIcon({
      html: '<div style="background:#22c55e;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🏪</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: '',
    });
    L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map).bindPopup('HALLOFRESH Store');
    bounds.push([storeLat, storeLng]);

    // Delivery location marker
    if (deliveryLat && deliveryLng) {
      const deliveryIcon = L.divIcon({
        html: '<div style="background:#3b82f6;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      });
      L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon }).addTo(map).bindPopup('Delivery Location');
      bounds.push([deliveryLat, deliveryLng]);
    }

    // Rider marker
    if (riderLat && riderLng) {
      const riderIcon = L.divIcon({
        html: '<div style="background:#f59e0b;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🏍️</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: '',
      });
      L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map).bindPopup('Your Rider');
      bounds.push([riderLat, riderLng]);

      // Draw route line from rider to delivery
      if (deliveryLat && deliveryLng) {
        L.polyline(
          [[riderLat, riderLng], [deliveryLat, deliveryLng]],
          { color: '#f59e0b', weight: 3, dashArray: '8, 8', opacity: 0.7 }
        ).addTo(map);
      }
    }

    // Fit bounds
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, 14);
    }
  }, [storeLat, storeLng, deliveryLat, deliveryLng, riderLat, riderLng]);

  return (
    <div ref={mapRef} className={`w-full rounded-2xl overflow-hidden ${className}`} style={{ height: '250px' }} />
  );
}
