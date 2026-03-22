import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notificationSound';

/**
 * Listens for new products added to the store via Supabase Realtime
 * and shows a toast + sound notification to customers.
 */
export function useNewProductNotifications() {
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Give a short delay so the initial data load doesn't trigger notifications
    const timeout = setTimeout(() => {
      isFirstLoad.current = false;
    }, 3000);

    const channel = supabase
      .channel('new-products')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
          filter: 'is_active=eq.true',
        },
        (payload) => {
          if (isFirstLoad.current) return;

          const product = payload.new as { name: string; price: number; image_url?: string };

          playNotificationSound('delivery');

          toast('🆕 New product just added!', {
            description: `${product.name} — KSh ${Number(product.price).toLocaleString()}`,
            duration: 6000,
          });

          // Browser push notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('New on HALLOFRESH! 🛒', {
                body: `${product.name} is now available — KSh ${Number(product.price).toLocaleString()}`,
                icon: '/pwa-192x192.png',
              });
            } catch {
              // Silent fail for environments that don't support Notification constructor
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, []);
}
