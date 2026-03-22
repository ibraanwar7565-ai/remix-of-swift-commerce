import { useEffect, useState, useCallback } from 'react';
import { ThemeToggle } from '@/components/store/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { Package, MapPin, Clock, CheckCircle, Power, Truck, Phone, Navigation, MessageCircle, History, ShoppingCart, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notificationSound';

const IncomingOrdersSection = () => {
  const { data: incomingOrders, isLoading } = useQuery({
    queryKey: ['incoming-orders-rider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_amount, status, customer_name, customer_phone, customer_email, created_at,
          order_items (
            id, quantity, unit_price,
            products:product_id (name, image_url)
          )
        `)
        .in('status', ['unpaid', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 1000 * 15,
  });

  if (isLoading || !incomingOrders?.length) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary" />
        Incoming Requests
        <Badge className="bg-primary/10 text-primary">{incomingOrders.length}</Badge>
      </h2>
      <div className="space-y-3">
        {incomingOrders.map((order: any) => (
          <Card key={order.id} className="p-4 border-2 border-primary/20">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{order.customer_name || 'Customer'}</p>
                <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <Badge className="bg-muted text-muted-foreground">New Order</Badge>
            </div>
            {/* Customer contact details - NO payment status shown to riders */}
            <div className="space-y-1 mb-3">
              {order.customer_phone && order.customer_phone !== '0000000000' && (
                <a href={`tel:${order.customer_phone}`} className="text-sm text-primary flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {order.customer_phone}
                </a>
              )}
              {order.customer_email && (
                <p className="text-xs text-muted-foreground">{order.customer_email}</p>
              )}
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                  <span className="font-medium">KES {(item.unit_price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>KES {order.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const RiderDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      toast.success('Notifications enabled! You\'ll be alerted for new deliveries.');
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const notif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: 'new-delivery',
      } as NotificationOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // SW notification fallback for PWA
      navigator.serviceWorker?.ready?.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: 'new-delivery',
        });
      });
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  // Get rider record for current user
  const { data: rider } = useQuery({
    queryKey: ['rider-record', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get rider's assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['rider-assignments', rider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_assignments')
        .select(`
          *,
          orders:order_id (
            id, total_amount, status, customer_name, customer_phone,
            delivery_addresses:delivery_address_id (address_line, city, latitude, longitude, building_name, house_number, floor, delivery_instructions),
            order_items (
              id, quantity, unit_price,
              products:product_id (name)
            )
          )
        `)
        .eq('rider_id', rider!.id)
        .in('status', ['assigned', 'picked_up', 'in_transit', 'preparing'])
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!rider,
    refetchInterval: 10000,
  });

  // Realtime: instantly show new assignments and order status changes
  useEffect(() => {
    if (!rider) return;
    const channel = supabase
      .channel('rider-assignments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rider_assignments',
          filter: `rider_id=eq.${rider.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['rider-assignments', rider.id] });
          queryClient.invalidateQueries({ queryKey: ['rider-delivered-count', rider.id] });
          if (payload.eventType === 'INSERT') {
            playNotificationSound('delivery');
            toast('🚀 New delivery assigned!', { description: 'Check your active deliveries.' });
            sendBrowserNotification(
              '🚀 New Delivery Assigned!',
              'You have a new delivery. Open the app to view details.'
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rider-assignments', rider.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rider, queryClient, sendBrowserNotification]);

  // Stats
  const assignedCount = assignments?.filter(a => a.status === 'assigned').length || 0;
  const inTransitCount = assignments?.filter(a => ['picked_up', 'in_transit'].includes(a.status)).length || 0;

  const { data: deliveredCount } = useQuery({
    queryKey: ['rider-delivered-count', rider?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('rider_assignments')
        .select('id', { count: 'exact' })
        .eq('rider_id', rider!.id)
        .eq('status', 'delivered');
      return count || 0;
    },
    enabled: !!rider,
  });

  // Delivery history
  const [showHistory, setShowHistory] = useState(false);
  const { data: deliveryHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['rider-delivery-history', rider?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_assignments')
        .select(`
          *,
          orders:order_id (
            id, total_amount, status, customer_name, customer_phone,
            delivery_addresses:delivery_address_id (address_line, city, building_name, house_number, floor, delivery_instructions),
            order_items (
              id, quantity, unit_price,
              products:product_id (name)
            )
          )
        `)
        .eq('rider_id', rider!.id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!rider && showHistory,
  });

  // Mutation: pick up order
  const pickUpOrder = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('rider_assignments')
        .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-assignments'] });
      toast.success('Order picked up! Head to the customer.');
    },
    onError: () => toast.error('Failed to update'),
  });

  // Mutation: mark delivered
  const markDelivered = useMutation({
    mutationFn: async ({ assignmentId, orderId }: { assignmentId: string; orderId: string }) => {
      // Update assignment
      const { error: aErr } = await supabase
        .from('rider_assignments')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', assignmentId);
      if (aErr) throw aErr;

      // Update order to delivered
      const { error: oErr } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);
      if (oErr) throw oErr;

      // Insert order_tracking entry for delivered
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'delivered',
        notes: 'Order delivered by rider',
      });

      // Record cash revenue on delivery (M-Pesa is auto-recorded at confirmation)
      const { data: order } = await supabase
        .from('orders')
        .select('total_amount, mpesa_receipt_number, payment_method, branch_id')
        .eq('id', orderId)
        .single();

      if (order && order.payment_method !== 'mpesa' && !order.mpesa_receipt_number) {
        const { data: existing } = await supabase
          .from('expenses')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!existing) {
          const payload: any = {
            order_id: orderId,
            rider_id: rider?.id || null,
            amount: order.total_amount,
            type: 'cash_collection',
            description: `Cash collected on delivery #${orderId.slice(0, 8).toUpperCase()}`,
          };
          if (order.branch_id) payload.branch_id = order.branch_id;
          await supabase.from('expenses').insert(payload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider-delivered-count'] });
      toast.success('Order delivered! 🎉');
    },
    onError: () => toast.error('Failed to update'),
  });

  const openDirections = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const stats = [
    { icon: Package, label: 'Assigned', value: String(assignedCount), color: 'text-blue-400' },
    { icon: Clock, label: 'In Transit', value: String(inTransitCount), color: 'text-amber-400' },
    { icon: CheckCircle, label: 'Delivered', value: String(deliveredCount || 0), color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header – keep existing */}
      <header
        className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hi, {profile?.full_name?.split(' ')[0] || 'Rider'} 👋
            </h1>
            <p className="text-sm text-muted-foreground">Rider Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <ColorSchemePicker />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/rider/chat')}>
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Badge variant="outline" className="border-emerald-500 text-emerald-500">
              <Power className="h-3 w-3 mr-1" /> Online
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Notification permission banner */}
        {notifPermission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-left"
          >
            <Bell className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Enable Notifications</p>
              <p className="text-xs text-muted-foreground">Get alerted instantly when a new delivery is assigned to you</p>
            </div>
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* My Active Deliveries */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">My Active Deliveries</h2>
          {assignmentsLoading ? (
            <Card className="p-4"><Skeleton className="h-16 w-full" /></Card>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment: any) => {
                const order = assignment.orders;
                const address = order?.delivery_addresses;
                const isAssigned = assignment.status === 'assigned';
                const isPickedUp = assignment.status === 'picked_up' || assignment.status === 'in_transit';
                const isPreparing = order?.status === 'confirmed' || order?.status === 'processing';

                return (
                  <div key={assignment.id}>
                    <Card className="p-4 border-2 border-primary/20">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{order?.customer_name || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">
                            #{order?.id?.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <Badge className={
                          isPreparing ? 'bg-orange-100 text-orange-700' :
                          isAssigned ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }>
                          {isPreparing ? '🍳 Preparing' : isAssigned ? '📦 Pick Up' : '🚀 Delivering'}
                        </Badge>
                      </div>

                      {/* Customer contact */}
                      <div className="space-y-1 mb-3">
                        <a href={`tel:${order?.customer_phone}`} className="text-sm text-primary flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {order?.customer_phone}
                        </a>
                        {address && (
                          <div className="space-y-0.5">
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {address.address_line}, {address.city}
                            </p>
                            {(address.building_name || address.house_number) && (
                              <p className="text-xs text-muted-foreground ml-5">
                                {address.building_name && <span>🏢 {address.building_name}</span>}
                                {address.house_number && <span>{address.building_name ? ' · ' : ''}🚪 {address.house_number}</span>}
                                {address.floor && <span> · Floor: {address.floor}</span>}
                              </p>
                            )}
                            {address.delivery_instructions && (
                              <p className="text-xs text-primary ml-5">📝 {address.delivery_instructions}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Order items */}
                      <div className="bg-muted/50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">ORDER ITEMS</p>
                        {order?.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                            <span className="font-medium">KES {(item.unit_price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-sm">
                          <span>Total</span>
                          <span>KES {order?.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {address?.latitude && address?.longitude && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openDirections(address.latitude!, address.longitude!)}
                          >
                            <Navigation className="h-4 w-4" />
                            Directions
                          </Button>
                        )}
                        {isPreparing && (
                          <Badge variant="outline" className="flex-1 justify-center py-2 text-orange-600 border-orange-300">
                            ⏳ Order being prepared...
                          </Badge>
                        )}
                        {isAssigned && !isPreparing && (
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => pickUpOrder.mutate(assignment.id)}
                            disabled={pickUpOrder.isPending}
                          >
                            <Package className="h-4 w-4" />
                            Picked Up
                          </Button>
                        )}
                        {isPickedUp && (
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => markDelivered.mutate({ assignmentId: assignment.id, orderId: order?.id })}
                            disabled={markDelivered.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 flex flex-col items-center justify-center text-center">
              <Truck className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No active deliveries</p>
              <p className="text-sm text-muted-foreground/70">New assignments will appear here</p>
            </Card>
          )}
        </div>

        {/* Incoming Requests */}
        <IncomingOrdersSection />

        {/* Delivery History */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3 w-full"
          >
            <History className="h-5 w-5" />
            Delivery History ({deliveredCount || 0})
            <span className="text-xs text-muted-foreground ml-auto">
              {showHistory ? 'Hide' : 'Show'}
            </span>
          </button>

          {showHistory && (
            <>
              {historyLoading ? (
                <Card className="p-4"><Skeleton className="h-16 w-full" /></Card>
              ) : deliveryHistory && deliveryHistory.length > 0 ? (
                <div className="space-y-3">
                  {deliveryHistory.map((assignment: any) => {
                    const order = assignment.orders;
                    const address = order?.delivery_addresses;
                    return (
                      <div key={assignment.id}>
                        <Card className="p-4 opacity-80">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{order?.customer_name || 'Customer'}</p>
                              <p className="text-xs text-muted-foreground">
                                #{order?.id?.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              ✅ Delivered
                            </Badge>
                          </div>
                          <div className="space-y-1 mb-2">
                            {address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {address.address_line}, {address.city}
                              </p>
                            )}
                            {assignment.delivered_at && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {new Date(assignment.delivered_at).toLocaleDateString('en-KE', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            {order?.order_items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                                <span className="font-medium">KES {(item.unit_price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="border-t border-border mt-1 pt-1 flex justify-between font-bold text-sm">
                              <span>Total</span>
                              <span>KES {order?.total_amount?.toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">No completed deliveries yet</p>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RiderDashboard;
