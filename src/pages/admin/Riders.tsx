import { useState, useMemo } from 'react';
import { Bike, Phone, MapPin, Package, CheckCircle, Clock, Circle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type RiderWithDetails = {
  id: string;
  user_id: string;
  phone: string;
  status: string;
  vehicle_type: string | null;
  license_plate: string | null;
  created_at: string;
  profile_name: string;
  activeDeliveries: number;
  completedDeliveries: number;
  assignments: any[];
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  available: { label: 'Available', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  online: { label: 'Online', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  busy: { label: 'Busy', color: 'bg-amber-100 text-amber-700', icon: Clock },
  offline: { label: 'Offline', color: 'bg-muted text-muted-foreground', icon: Circle },
};

const getStatusConfig = (status: string) =>
  statusConfig[status] || statusConfig.offline;

type FilterTab = 'all' | 'available' | 'busy' | 'offline';

export default function AdminRiders() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedRider, setExpandedRider] = useState<string | null>(null);

  const { data: riders, isLoading, refetch } = useQuery({
    queryKey: ['admin-riders-full'],
    queryFn: async () => {
      // Fetch riders, profiles, and assignments in parallel
      const [ridersRes, profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('riders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name'),
        supabase.from('rider_assignments').select(`
          id, rider_id, status, assigned_at, delivered_at,
          orders:order_id (
            id, customer_name, customer_phone, total_amount, status,
            delivery_addresses:delivery_address_id (address_line, city)
          )
        `).order('assigned_at', { ascending: false }),
      ]);

      const profileMap = new Map(
        (profilesRes.data || []).map(p => [p.user_id, p.full_name || 'Unnamed Rider'])
      );

      const assignmentsByRider = new Map<string, any[]>();
      (assignmentsRes.data || []).forEach(a => {
        const list = assignmentsByRider.get(a.rider_id) || [];
        list.push(a);
        assignmentsByRider.set(a.rider_id, list);
      });

      return (ridersRes.data || []).map((r): RiderWithDetails => {
        const riderAssignments = assignmentsByRider.get(r.id) || [];
        const active = riderAssignments.filter(a => ['assigned', 'picked_up', 'in_transit'].includes(a.status));
        const completed = riderAssignments.filter(a => a.status === 'delivered');

        return {
          ...r,
          profile_name: profileMap.get(r.user_id) || 'Unnamed Rider',
          activeDeliveries: active.length,
          completedDeliveries: completed.length,
          assignments: riderAssignments.slice(0, 10), // latest 10
        };
      });
    },
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  const filteredRiders = useMemo(() => riders?.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'available') return r.status === 'available' || r.status === 'online';
    if (activeTab === 'busy') return r.status === 'busy' || r.activeDeliveries > 0;
    if (activeTab === 'offline') return r.status === 'offline';
    return true;
  }), [riders, activeTab]);

  const tabs = useMemo((): { key: FilterTab; label: string; count: number }[] => [
    { key: 'all', label: 'All', count: riders?.length || 0 },
    { key: 'available', label: 'Available', count: riders?.filter(r => r.status === 'available' || r.status === 'online').length || 0 },
    { key: 'busy', label: 'Busy', count: riders?.filter(r => r.status === 'busy' || r.activeDeliveries > 0).length || 0 },
    { key: 'offline', label: 'Offline', count: riders?.filter(r => r.status === 'offline').length || 0 },
  ], [riders]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Riders</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-5 w-5" />
          </Button>
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

      {/* Rider List */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))
        ) : filteredRiders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bike className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No riders in this category</p>
          </div>
        ) : (
          filteredRiders?.map(rider => {
            const isExpanded = expandedRider === rider.id;
            const sc = getStatusConfig(rider.status);
            const StatusIcon = sc.icon;

            return (
              <Card key={rider.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedRider(prev => prev === rider.id ? null : rider.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        rider.status === 'available' || rider.status === 'online'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {rider.profile_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{rider.profile_name}</p>
                        <p className="text-xs text-muted-foreground">{rider.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={sc.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {sc.label}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {rider.activeDeliveries} active
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {rider.completedDeliveries} delivered
                    </span>
                    {rider.vehicle_type && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Bike className="h-3 w-3" />
                        {rider.vehicle_type}
                        {rider.license_plate ? ` • ${rider.license_plate}` : ''}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Contact */}
                    <div className="px-4 py-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${rider.phone}`} className="text-sm text-primary">{rider.phone}</a>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Joined {format(new Date(rider.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Active assignments */}
                    <div className="px-4 py-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Assignments</p>
                      {rider.assignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No assignments yet</p>
                      ) : (
                        <div className="space-y-2">
                          {rider.assignments.map((a: any) => {
                            const order = a.orders;
                            const isActive = ['assigned', 'picked_up', 'in_transit'].includes(a.status);
                            return (
                              <div
                                key={a.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg ${
                                  isActive ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {order?.customer_name || 'Customer'} — #{order?.id?.slice(0, 8).toUpperCase()}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {order?.delivery_addresses && (
                                      <span className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3" />
                                        {(order.delivery_addresses as any).address_line}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <Badge className={`text-[10px] ${
                                    isActive ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {a.status === 'delivered' ? 'Delivered' : a.status === 'picked_up' ? 'In Transit' : 'Assigned'}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    KES {order?.total_amount?.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
