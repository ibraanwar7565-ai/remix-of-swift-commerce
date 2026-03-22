import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notificationSound';

/**
 * Listens for new promotion_notification_logs for the current user
 * via Supabase Realtime and shows a toast + browser push notification.
 */
export function usePromotionNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('promo-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'promotion_notification_logs',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const log = payload.new as { promotion_id: string };

          // Fetch the promotion details
          const { data: promo } = await supabase
            .from('promotions')
            .select('product_name, message, price')
            .eq('id', log.promotion_id)
            .maybeSingle();

          if (!promo) return;

          const title = 'New on HALLOFRESH! 🛒';
          const body = promo.message || `${promo.product_name} is now available — KSh ${Number(promo.price).toLocaleString()}`;

          playNotificationSound('delivery');

          toast(title, {
            description: body,
            duration: 6000,
          });

          // Browser push notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body,
                icon: '/pwa-192x192.png',
              });
            } catch {
              // Silent fail
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
