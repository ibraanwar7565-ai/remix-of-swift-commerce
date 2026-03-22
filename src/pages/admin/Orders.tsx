import { useState, useMemo, useCallback, memo } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat, ArrowRight, Phone, MapPin, ChevronDown, ChevronUp, RefreshCw, UserCheck, Banknote, CreditCard } from 'lucide-react';
import { ThemeToggle } from '@/components/store/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { format } from 'date-fns';
import { toast } from 'sonner';

const orderStatuses = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { key: 'processing', label: 'Preparing', icon: ChefHat, color: 'bg-blue-100 text-blue-700' },
  { key: 'out_for_delivery', label: 'On the Way', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-primary/10 text-primary' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
];

// Linear flow: pending → confirmed → processing → out_for_delivery → delivered
// M-Pesa orders auto-advance to 'confirmed' on payment, so admin starts from confirmed
// Cash orders start at 'pending', admin manually confirms
const statusFlow = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];

const getNextStatus = (current: string) => {
  const idx = statusFlow.indexOf(current);
  if (idx === -1 || idx >= statusFlow.length - 1) return null;
  return statusFlow[idx + 1];
};

const getStatusConfig = (status: string) =>
  orderStatuses.find(s => s.key === status) || orderStatuses[0];

const getStepIndex = (status: string) => {
  const idx = statusFlow.indexOf(status);
  return idx === -1 ? 0 : idx;
};

type FilterTab = 'all' | 'pending' | 'active' | 'delivered';

const OrderCard = memo(({ order, isExpanded, onToggle, onUpdateStatus, onCancel, isUpdating, isCancelling, riders }: {
  order: any;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (orderId: string, newStatus: string, selectedRiderId?: string) => void;
  onCancel: (orderId: string) => void;
  isUpdating: boolean;
  isCancelling: boolean;
  riders: any[];
}) => {
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const isPaidViaMpesa = !!order.mpesa_receipt_number;
  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;
  const nextStatus = getNextStatus(order.status);
  const nextConfig = nextStatus ? getStatusConfig(nextStatus) : null;
  const stepIndex = getStepIndex(order.status);
  const isFinal = order.status === 'delivered' || order.status === 'cancelled';

  // Determine next action label
  const getNextActionLabel = () => {
    if (!nextStatus || !nextConfig) return '';
    if (nextStatus === 'confirmed') return 'Accept Order';
    if (nextStatus === 'processing') return 'Start Preparing';
    if (nextStatus === 'out_for_delivery') return 'Dispatch to Rider';
    if (nextStatus === 'delivered') return 'Mark Delivered';
    return `Move to ${nextConfig.label}`;
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold">{order.customer_name || 'Customer'}</p>
            <p className="text-xs text-muted-foreground">
              #{order.id.slice(0, 8).toUpperCase()} • {format(new Date(order.created_at), 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
            </span>
            {isPaidViaMpesa ? (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                <CreditCard className="h-3 w-3 mr-0.5" /> M-Pesa Paid
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                <Banknote className="h-3 w-3 mr-0.5" /> Cash
              </Badge>
            )}
          </div>
          <span className="font-bold">KES {order.total_amount.toLocaleString()}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {/* Progress steps */}
          {!isFinal && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                {statusFlow.map((step, i) => {
                  const stepConfig = getStatusConfig(step);
                  const StepIcon = stepConfig.icon;
                  const isCompleted = i <= stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] text-center leading-tight ${isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {stepConfig.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-2">
                {statusFlow.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Contact & address info */}
          <div className="px-4 py-2 space-y-1">
            {order.customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${order.customer_phone}`} className="text-primary">{order.customer_phone}</a>
              </div>
            )}
            {order.customer_email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>✉️</span>
                <span>{order.customer_email}</span>
              </div>
            )}
            {order.delivery_addresses && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{(order.delivery_addresses as any).address_line}, {(order.delivery_addresses as any).city}</span>
                </div>
                {((order.delivery_addresses as any).building_name || (order.delivery_addresses as any).house_number) && (
                  <div className="ml-5.5 pl-0.5 text-xs text-muted-foreground">
                    {(order.delivery_addresses as any).building_name && (
                      <span>🏢 {(order.delivery_addresses as any).building_name}</span>
                    )}
                    {(order.delivery_addresses as any).house_number && (
                      <span>{(order.delivery_addresses as any).building_name ? ' · ' : ''}🚪 {(order.delivery_addresses as any).house_number}</span>
                    )}
                    {(order.delivery_addresses as any).floor && (
                      <span> · Floor: {(order.delivery_addresses as any).floor}</span>
                    )}
                  </div>
                )}
                {(order.delivery_addresses as any).delivery_instructions && (
                  <div className="ml-5.5 pl-0.5 text-xs text-amber-600">
                    📝 {(order.delivery_addresses as any).delivery_instructions}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items</p>
            <div className="space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">🥬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.products?.name || 'Product'}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity} @ KES {item.unit_price.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold">KES {(item.unit_price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment status */}
          {!isFinal && (
            <div className="px-4 py-3 border-t border-border">
              {isPaidViaMpesa ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">M-Pesa Payment Confirmed</span>
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-[10px]">Paid</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                  <Banknote className="h-4 w-4" />
                  <span className="font-medium">Cash on Delivery</span>
                  <Badge className="ml-auto bg-amber-100 text-amber-700 text-[10px]">Collect on Delivery</Badge>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!isFinal && (
            <div className="px-4 py-3 border-t border-border space-y-3">
              {/* Rider picker - show when next step is out_for_delivery */}
              {nextStatus === 'out_for_delivery' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Assign a Rider</span>
                  </div>
                  {riders.length === 0 ? (
                    <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">No riders available. Create riders from Team Management.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {[...riders].sort((a, b) => (a.status === 'available' ? -1 : 1) - (b.status === 'available' ? -1 : 1)).map((r: any) => {
                        const isSelected = selectedRiderId === r.id;
                        const isAvailable = r.status === 'available' || r.status === 'online';
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRiderId(r.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                            }`}>
                              {r.name?.charAt(0) || 'R'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.phone}</p>
                            </div>
                            <Badge className={`text-[10px] ${
                              isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                            }`}>
                              {r.status}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {nextStatus && nextConfig && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => onUpdateStatus(order.id, nextStatus, nextStatus === 'out_for_delivery' ? selectedRiderId : undefined)}
                    disabled={isUpdating || (nextStatus === 'out_for_delivery' && !selectedRiderId)}
                  >
                    <nextConfig.icon className="h-4 w-4" />
                    {getNextActionLabel()}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                {/* Skip rider — mark delivered directly from processing (walk-in / self-pickup) */}
                {order.status === 'processing' && (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => onUpdateStatus(order.id, 'delivered')}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Delivered
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onCancel(order.id)}
                  disabled={isCancelling}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
OrderCard.displayName = 'OrderCard';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { isBranchAdmin, branchId } = useUserRole();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', branchId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id, quantity, unit_price, product_id,
            products:product_id (name, image_url)
          ),
          delivery_addresses:delivery_address_id (
            address_line, city, latitude, longitude, building_name, house_number, floor, delivery_instructions
          )
        `)
        .neq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(50);

      if (isBranchAdmin && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  });

  // Fetch available riders
  const { data: ridersList } = useQuery({
    queryKey: ['admin-riders-list', branchId],
    queryFn: async () => {
      const [ridersRes, profilesRes] = await Promise.all([
        supabase.from('riders').select('id, phone, status, user_id'),
        supabase.from('profiles').select('user_id, full_name'),
      ]);
      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
      return (ridersRes.data || []).map(r => ({
        id: r.id,
        name: profileMap.get(r.user_id) || 'Rider',
        phone: r.phone,
        status: r.status,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus, riderId }: { orderId: string; newStatus: string; riderId?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;

      // Assign rider when dispatching
      if (newStatus === 'out_for_delivery' && riderId) {
        await supabase.from('rider_assignments').delete().eq('order_id', orderId);
        await supabase
          .from('rider_assignments')
          .insert({ order_id: orderId, rider_id: riderId, status: 'in_transit' });
      }

      // Insert order_tracking entry (non-blocking — don't fail the main action)
      supabase.from('order_tracking').insert({
        order_id: orderId,
        status: newStatus,
        notes: newStatus === 'delivered' ? 'Order delivered successfully' :
               newStatus === 'out_for_delivery' ? 'Dispatched to rider' :
               newStatus === 'processing' ? 'Order is being prepared' :
               newStatus === 'confirmed' ? 'Order confirmed' : null,
      }).then(({ error: tErr }) => { if (tErr) console.warn('Tracking insert failed:', tErr.message); });

      // Record cash revenue when order is delivered (M-Pesa is auto-recorded at confirmation)
      if (newStatus === 'delivered') {
        const order = orders?.find(o => o.id === orderId);
        if (order && order.payment_method !== 'mpesa' && !order.mpesa_receipt_number) {
          const { data: existing } = await supabase
            .from('expenses')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();
          if (!existing) {
            const payload: any = {
              order_id: orderId,
              amount: order.total_amount,
              type: 'cash_collection',
              description: 'Cash payment collected on delivery',
            };
            if (order.branch_id) payload.branch_id = order.branch_id;
            const { error: eErr } = await supabase.from('expenses').insert(payload);
            if (eErr) console.warn('Expense insert failed:', eErr.message);
          }
        }
      }
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      const config = getStatusConfig(newStatus);
      toast.success(
        newStatus === 'out_for_delivery'
          ? `Order dispatched — rider assigned!`
          : `Order moved to ${config.label}`
      );
    },
    onError: (err: any) => {
      console.error('Order update error:', err);
      toast.error(`Failed to update order: ${err?.message || 'Unknown error'}`);
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      // Cancellation triggers stock restore via DB trigger
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order cancelled — stock restored');
    },
    onError: () => toast.error('Failed to cancel order'),
  });

  const filteredOrders = useMemo(() => orders?.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'confirmed';
    if (activeTab === 'active') return ['processing', 'out_for_delivery'].includes(order.status);
    if (activeTab === 'delivered') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  }), [orders, activeTab]);

  const tabs = useMemo((): { key: FilterTab; label: string; count: number }[] => [
    { key: 'all', label: 'All', count: orders?.length || 0 },
    { key: 'pending', label: 'New', count: orders?.filter(o => o.status === 'pending' || o.status === 'confirmed').length || 0 },
    { key: 'active', label: 'Active', count: orders?.filter(o => ['processing', 'out_for_delivery'].includes(o.status)).length || 0 },
    { key: 'delivered', label: 'Done', count: orders?.filter(o => ['delivered', 'cancelled'].includes(o.status)).length || 0 },
  ], [orders]);

  const handleToggle = useCallback((id: string) => {
    setExpandedOrder(prev => prev === id ? null : id);
  }, []);

  const handleUpdateStatus = useCallback((orderId: string, newStatus: string, riderId?: string) => {
    updateStatus.mutate({ orderId, newStatus, riderId });
  }, [updateStatus]);

  const handleCancel = useCallback((orderId: string) => {
    cancelOrder.mutate(orderId);
  }, [cancelOrder]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Orders</h1>
          <div className="flex items-center gap-1">
            <ColorSchemePicker />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : filteredOrders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No orders in this category</p>
          </div>
        ) : (
          filteredOrders?.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrder === order.id}
              onToggle={() => handleToggle(order.id)}
              onUpdateStatus={handleUpdateStatus}
              onCancel={handleCancel}
              isUpdating={updateStatus.isPending}
              isCancelling={cancelOrder.isPending}
              riders={ridersList || []}
            />
          ))
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
