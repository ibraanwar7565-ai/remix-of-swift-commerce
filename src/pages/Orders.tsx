import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, MapPin, ChevronDown, ChevronUp, Truck, Phone, MessageCircle, Bike, ClipboardList, Bell, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { BottomNav } from '@/components/store/BottomNav';
import { CartDrawer } from '@/components/store/CartDrawer';
import { DeliveryMap } from '@/components/store/DeliveryMap';
import { formatDistanceToNow } from 'date-fns';
import { playNotificationSound } from '@/lib/notificationSound';
import { toast } from 'sonner';

function useOrderTranslations() {
  const { t } = useLanguage();
  const statusConfig: Record<string, { label: string; description: string; dotColor: string; icon: any; step: number }> = {
    pending: { label: t('statusPending'), description: t('statusDescPending'), dotColor: 'bg-amber-500', icon: Clock, step: 0 },
    confirmed: { label: t('statusConfirmed'), description: t('statusDescConfirmed'), dotColor: 'bg-emerald-500', icon: CheckCircle, step: 1 },
    processing: { label: t('statusPreparing'), description: t('statusDescPreparing'), dotColor: 'bg-blue-500', icon: Package, step: 2 },
    out_for_delivery: { label: t('statusOnTheWay'), description: t('statusDescOnTheWay'), dotColor: 'bg-purple-500', icon: Bike, step: 3 },
    delivered: { label: t('statusDelivered'), description: t('statusDescDelivered'), dotColor: 'bg-primary', icon: CheckCircle, step: 4 },
    cancelled: { label: t('statusCancelled'), description: t('statusDescCancelled'), dotColor: 'bg-destructive', icon: XCircle, step: -1 },
    unpaid: { label: t('statusPending'), description: t('statusDescPending'), dotColor: 'bg-amber-500', icon: Clock, step: 0 },
    completed: { label: t('statusDelivered'), description: t('statusDescDelivered'), dotColor: 'bg-primary', icon: CheckCircle, step: 4 },
    failed: { label: t('statusCancelled'), description: t('statusDescCancelled'), dotColor: 'bg-destructive', icon: XCircle, step: -1 },
  };
  const trackingSteps = [
    { label: t('stepPlaced'), icon: Clock },
    { label: t('stepConfirmed'), icon: CheckCircle },
    { label: t('stepPreparing'), icon: Package },
    { label: t('stepOnTheWay'), icon: Bike },
    { label: t('stepDelivered'), icon: CheckCircle },
  ];
  return { statusConfig, trackingSteps };
}

type TabType = 'running' | 'history';

function OrderCard({ order, activeTab, isExpanded, onToggle, onReorder }: {
  order: any;
  activeTab: TabType;
  isExpanded: boolean;
  onToggle: () => void;
  onReorder: (items: any[]) => void;
}) {
  const { t } = useLanguage();
  const { statusConfig, trackingSteps } = useOrderTranslations();
  const status = statusConfig[order.status as string] || statusConfig.pending;
  const assignment = order.rider_assignments?.[0];
  const rider = assignment?.riders;
  const isActive = ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(order.status);
  const items = order.order_items || [];
  const deliveryAddr = order.delivery_addresses;
  const paymentMethod = order.payment_method || (order.mpesa_receipt_number ? 'mpesa' : 'cash');
  const isPaid = !!order.mpesa_receipt_number || order.status !== 'pending';

  const currentStep = useMemo(() => {
    const s = order.status;
    if (s === 'delivered' || s === 'completed') return 5;
    if (s === 'out_for_delivery') return 4;
    if (s === 'processing') return 3;
    if (s === 'confirmed') return 2;
    if (s === 'pending' || s === 'unpaid') return 1;
    return 0;
  }, [order.status]);

  const itemNames = useMemo(() =>
    items.map((i: any) => `${i.quantity}x ${i.products?.name || 'Item'}`).join(', '),
    [items]
  );

  const isCancelled = order.status === 'cancelled' || order.status === 'failed';

  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <p className="font-bold text-base text-foreground">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          {activeTab === 'history' && (
            <span className={`flex items-center gap-1 text-xs font-semibold ${
              (order.status === 'delivered' || order.status === 'completed') ? 'text-primary' : 'text-destructive'
            }`}>
              {(order.status === 'delivered' || order.status === 'completed') ? `✓ ${t('statusDelivered')}` : `✗ ${t('statusCancelled')}`}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-1 mb-2 pl-7">
          {itemNames || 'No items'}
        </p>

        <div className="flex items-center justify-between pl-7">
          {activeTab === 'running' ? (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
              <span className="text-xs font-medium text-foreground">{status.label}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                paymentMethod === 'mpesa' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {paymentMethod === 'mpesa' ? <Phone className="h-2.5 w-2.5" /> : <Wallet className="h-2.5 w-2.5" />}
                {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              KES {order.total_amount.toLocaleString()}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {activeTab === 'running' && !isExpanded && (
          <div className="mt-3 pl-7">
            <span className="text-xs font-semibold text-primary">{t('trackOrder')} →</span>
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {/* Tracking Progress */}
          {!isCancelled && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                {trackingSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  const isCompleted = i + 1 <= currentStep;
                  const isCurrent = i + 1 === currentStep;
                  return (
                    <div key={step.label} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] text-center ${isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Status explanation */}
              <p className="text-xs text-muted-foreground text-center mt-3 bg-muted/50 rounded-lg py-2 px-3">
                {status.description}
              </p>
            </div>
          )}

          {/* Cancelled status */}
          {isCancelled && (
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl p-3">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{status.description}</span>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="px-4 py-2">
            <div className={`flex items-center gap-2 rounded-xl p-3 ${
              paymentMethod === 'mpesa' 
                ? (order.mpesa_receipt_number ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20')
                : 'bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {paymentMethod === 'mpesa' ? <Phone className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              <div className="flex-1">
                <p className="text-xs font-semibold">{paymentMethod === 'mpesa' ? t('mpesaPayment') : t('cashOnDelivery')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {paymentMethod === 'mpesa' 
                    ? (order.mpesa_receipt_number ? `${t('paid')} • ${t('receipt')}: ${order.mpesa_receipt_number}` : t('awaitingPayment'))
                    : (order.status === 'delivered' || order.status === 'completed' ? t('collected') : t('payWhenDelivered'))
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          {isActive && (
            <div className="px-4 py-3">
              <DeliveryMap
                deliveryLat={deliveryAddr?.latitude}
                deliveryLng={deliveryAddr?.longitude}
                riderLat={rider?.current_latitude}
                riderLng={rider?.current_longitude}
              />
            </div>
          )}

          {/* Delivery Address */}
          {deliveryAddr && (
            <div className="px-4 py-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t('deliveryTo')}</p>
                <p className="text-xs text-muted-foreground">{deliveryAddr.address_line}, {deliveryAddr.city}</p>
              </div>
            </div>
          )}

          {/* Rider */}
          {rider && (assignment?.status === 'picked_up' || assignment?.status === 'in_transit' || order.status === 'delivered' || order.status === 'completed') && (
            <div className="mx-4 my-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-2">🏍️ {t('yourRider')}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{t('yourRider')}</p>
                  <p className="text-xs text-muted-foreground">{rider.phone}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${rider.phone}`} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-4 w-4" />
                  </a>
                  <a href={`sms:${rider.phone}`} className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm font-semibold mb-2">{t('items')}</p>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">🥬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.products?.name || 'Product'}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">KES {(item.unit_price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* History actions */}
          {activeTab === 'history' && (order.status === 'delivered' || order.status === 'completed') && (
            <div className="px-4 pb-4 flex gap-3">
              <Button variant="outline" size="sm" className="rounded-full flex-1 border-primary text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); onReorder(items); }}>
                {t('reorder')}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full text-primary">
                {t('rate')}
              </Button>
            </div>
          )}
          {activeTab === 'history' && order.status !== 'delivered' && order.status !== 'completed' && (
            <div className="px-4 pb-4">
              <Button variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); onReorder(items); }}>
                {t('reorder')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('running');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  const statusMessages: Record<string, string> = {
    confirmed: t('orderConfirmed'),
    processing: t('orderPreparing'),
    out_for_delivery: t('orderOnTheWay'),
    delivered: t('orderDelivered'),
    cancelled: t('orderCancelled'),
  };

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, quantity, unit_price, product_id,
            products:product_id (name, image_url)
          ),
          delivery_addresses:delivery_address_id (
            address_line, city, latitude, longitude
          ),
          rider_assignments (
            status,
            riders:rider_id (
              current_latitude, current_longitude, phone
            )
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Smart polling: only poll when there are active orders
      const data = query.state.data as any[] | undefined;
      if (!data) return 10000; // Initial load
      const hasActive = data.some((o: any) => ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(o.status));
      return hasActive ? 15000 : false; // Stop polling if no active orders
    },
    staleTime: 1000 * 15,
  });

  // Keep track of known statuses to detect changes
  useEffect(() => {
    if (orders) {
      const map = new Map<string, string>();
      orders.forEach((o: any) => map.set(o.id, o.status));
      prevStatusRef.current = map;
    }
  }, [orders]);

  // Realtime subscription for instant status updates with sound + toast
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customer-order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as string;
          const orderId = payload.new?.id as string;
          const oldStatus = prevStatusRef.current.get(orderId);

          if (newStatus && newStatus !== oldStatus) {
            const message = statusMessages[newStatus];
            if (message) {
              playNotificationSound('delivery');
              toast(message, {
                description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
                duration: 5000,
              });

              // Browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('HALLOFRESH Order Update', {
                  body: `${message} — Order #${orderId.slice(0, 8).toUpperCase()}`,
                  icon: '/pwa-192x192.png',
                });
              }
            }

            prevStatusRef.current.set(orderId, newStatus);
            refetch();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rider_assignments',
        },
        () => {
          // Rider assigned or status changed — refetch to show rider info
          refetch();
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const { runningOrders, historyOrders } = useMemo(() => {
    const running = orders?.filter((o: any) =>
      ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(o.status)
    ) || [];
    const history = orders?.filter((o: any) =>
      ['delivered', 'completed', 'failed', 'cancelled'].includes(o.status)
    ) || [];
    return { runningOrders: running, historyOrders: history };
  }, [orders]);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  }, []);

  const handleReorder = useCallback(async (orderItems: any[]) => {
    for (const item of orderItems) {
      if (item.products && item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .eq('is_active', true)
          .maybeSingle();
        if (product && product.inventory_count > 0) {
          const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            inventory_count: product.inventory_count,
            category: product.category,
            unit: product.unit,
          };
          const existing = JSON.parse(localStorage.getItem('hallofresh_cart') || '[]');
          const existingIdx = existing.findIndex((c: any) => c.product?.id === product.id);
          if (existingIdx >= 0) {
            existing[existingIdx].quantity += item.quantity;
          } else {
            existing.push({ product: cartItem, quantity: item.quantity });
          }
          localStorage.setItem('hallofresh_cart', JSON.stringify(existing));
        }
      }
    }
    // Flag reorder so checkout skips delivery details entry and goes straight to payment
    localStorage.setItem('hallofresh_reorder', 'true');
    toast.success(t('itemsAddedToCart'));
    navigate('/cart');
  }, [navigate]);

  const displayOrders = activeTab === 'running' ? runningOrders : historyOrders;

  return (
    <CartProvider>
      <div className="min-h-[100dvh] bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t('myOrders')}</h1>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['running', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center text-base font-semibold transition-colors relative ${
                activeTab === tab ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab === 'running' ? `${t('running')} (${runningOrders.length})` : `${t('history')} (${historyOrders.length})`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-4">
          {!user ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">{t('signInToViewOrders')}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t('trackOrdersDesc')}</p>
              <Button onClick={() => navigate('/auth')} className="rounded-full px-8">{t('signIn')}</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-card rounded-2xl">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {activeTab === 'running' ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                    <Bike className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{t('noActiveOrders')}</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                    {t('noActiveOrdersDesc')}
                  </p>
                  <Button onClick={() => navigate('/store')} className="rounded-full px-6">
                    {t('browseGrocery')}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
                    <ClipboardList className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">{t('noOrderHistory')}</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                    {t('noOrderHistoryDesc')}
                  </p>
                  <Button onClick={() => navigate('/store')} className="rounded-full px-6">
                    {t('browseGrocery')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayOrders.map((order: any, index: number) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  activeTab={activeTab}
                  isExpanded={expandedOrder === order.id}
                  onToggle={() => toggleExpand(order.id)}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}
        </div>

        <CartDrawer />
        <BottomNav />
      </div>
    </CartProvider>
  );
}
