import { useMemo, useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Package, Users, AlertTriangle, MapPin, QrCode, LogOut, Trash2, Bike, ShoppingCart, Bell, ArrowRight, Clock, CheckCircle, XCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { ThemeToggle } from '@/components/store/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { startOfMonth, endOfMonth, subDays, subMonths, format, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notificationSound';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isMainAdmin, isBranchAdmin, branchId } = useUserRole();
  const queryClient = useQueryClient();
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  // Realtime: instantly show new orders + play sound
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        // Branch admin: only notify if order is for their branch
        if (isBranchAdmin && branchId && (payload.new as any)?.branch_id !== branchId) return;
        playNotificationSound('order');
        const name = (payload.new as any)?.customer_name || 'Customer';
        toast('🛒 New order received!', { description: `From ${name}` });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-sales-chart'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (isBranchAdmin && branchId && (payload.new as any)?.branch_id !== branchId) return;
        const newStatus = (payload.new as any)?.status;
        const oldStatus = (payload.old as any)?.status;
        if (newStatus === 'delivered' && oldStatus !== 'delivered') {
          playNotificationSound('order');
          toast.success('💰 Payment confirmed!', { description: `KES ${Number((payload.new as any)?.total_amount || 0).toLocaleString()} received` });
        }
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-sales-chart'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, isBranchAdmin, branchId]);

  // Reset data mutation - only for main admin
  const resetData = useMutation({
    mutationFn: async () => {
      await supabase.from('rider_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setResetConfirmText('');
      toast.success('All order data has been reset');
    },
    onError: () => toast.error('Failed to reset data. Check permissions.'),
  });

  // Main stats - scoped by branch for branch admins
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats', branchId],
    queryFn: async () => {
      const now = new Date();
      const thisMonth = startOfMonth(now);
      const lastMonth = startOfMonth(subDays(thisMonth, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonth, 1));
      const todayStart = startOfDay(now);

      // Build expense queries scoped by branch
      const buildExpenseQuery = (base: any) => {
        if (isBranchAdmin && branchId) return base.eq('branch_id', branchId);
        return base;
      };

      const [todayExpenses, thisMonthExpenses, lastMonthExpenses, activeRes, pendingRes, lowStockRes, allTimeExpenses] = await Promise.all([
        buildExpenseQuery(supabase.from('expenses').select('amount, type').gte('created_at', todayStart.toISOString())),
        buildExpenseQuery(supabase.from('expenses').select('amount, type').gte('created_at', thisMonth.toISOString())),
        buildExpenseQuery(supabase.from('expenses').select('amount').gte('created_at', lastMonth.toISOString()).lte('created_at', lastMonthEnd.toISOString())),
        isBranchAdmin && branchId
          ? supabase.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'processing', 'confirmed']).eq('branch_id', branchId)
          : supabase.from('orders').select('id', { count: 'exact' }).in('status', ['pending', 'processing', 'confirmed']),
        isBranchAdmin && branchId
          ? supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending').eq('branch_id', branchId)
          : supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('products').select('id, name').lte('inventory_count', 5).eq('is_active', true),
        buildExpenseQuery(supabase.from('expenses').select('amount, type')),
      ]);

      const splitByType = (items: { amount: number; type: string }[] | null) => {
        const mpesa = (items || []).filter(e => e.type === 'mpesa_payment').reduce((s, e) => s + Number(e.amount), 0);
        const cash = (items || []).filter(e => e.type === 'cash_collection').reduce((s, e) => s + Number(e.amount), 0);
        const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);
        return { mpesa, cash, total };
      };

      const todaySplit = splitByType(todayExpenses.data as any);
      const monthSplit = splitByType(thisMonthExpenses.data as any);
      const allTimeSplit = splitByType(allTimeExpenses.data as any);
      const lastMonthTotal = lastMonthExpenses.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 1;
      const salesChange = ((monthSplit.total - lastMonthTotal) / lastMonthTotal * 100).toFixed(1);

      return {
        totalSales: monthSplit.total,
        salesChange: Number(salesChange),
        activeOrders: activeRes.count || 0,
        newRequests: pendingRes.count || 0,
        lowStockCount: lowStockRes.data?.length || 0,
        todaySales: todaySplit.total,
        todayMpesa: todaySplit.mpesa,
        todayCash: todaySplit.cash,
        todayOrderCount: todayExpenses.data?.length || 0,
        allTimeSales: allTimeSplit.total,
        allTimeMpesa: allTimeSplit.mpesa,
        allTimeCash: allTimeSplit.cash,
        allTimeOrderCount: allTimeExpenses.data?.length || 0,
        monthMpesa: monthSplit.mpesa,
        monthCash: monthSplit.cash,
      };
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  });

  // 7-day sales chart data - scoped by branch
  const { data: chartData } = useQuery({
    queryKey: ['admin-sales-chart', branchId],
    queryFn: async () => {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
      let query = supabase
        .from('expenses')
        .select('amount, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (isBranchAdmin && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const dayMap = new Map<string, { sales: number; orders: number }>();
      for (let i = 6; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        dayMap.set(day.toISOString(), { sales: 0, orders: 0 });
      }

      (data || []).forEach(e => {
        const day = startOfDay(new Date(e.created_at)).toISOString();
        const entry = dayMap.get(day);
        if (entry) {
          entry.sales += Number(e.amount);
          entry.orders += 1;
        }
      });

      return Array.from(dayMap.entries()).map(([date, val]) => ({
        date,
        label: format(new Date(date), 'EEE'),
        sales: val.sales,
        orders: val.orders,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Recent orders - scoped by branch
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders', branchId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (isBranchAdmin && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 15000,
  });

  // Rider overview - RLS already scopes this for branch admins
  const { data: riderOverview } = useQuery({
    queryKey: ['admin-rider-overview', branchId],
    queryFn: async () => {
      const [ridersRes, profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('riders').select('id, status, user_id'),
        supabase.from('profiles').select('user_id, full_name'),
        supabase.from('rider_assignments').select('rider_id, status').in('status', ['assigned', 'picked_up', 'in_transit']),
      ]);
      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
      const activeAssignments = new Map<string, number>();
      (assignmentsRes.data || []).forEach(a => {
        activeAssignments.set(a.rider_id, (activeAssignments.get(a.rider_id) || 0) + 1);
      });

      const riders = (ridersRes.data || []).map(r => ({
        id: r.id,
        name: profileMap.get(r.user_id) || 'Rider',
        status: r.status,
        activeDeliveries: activeAssignments.get(r.id) || 0,
      }));

      return {
        total: riders.length,
        online: riders.filter(r => r.status === 'available' || r.status === 'online').length,
        busy: riders.filter(r => r.activeDeliveries > 0).length,
        offline: riders.filter(r => r.status === 'offline').length,
        riders: riders.slice(0, 5),
      };
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  });

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700', icon: Clock },
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    processing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: Package },
    out_for_delivery: { label: 'On the Way', color: 'bg-purple-100 text-purple-700', icon: Bike },
    delivered: { label: 'Delivered', color: 'bg-primary/10 text-primary', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  };

  const getTimeAgo = useCallback((date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return format(new Date(date), 'MMM d');
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Hi, {user?.user_metadata?.full_name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'EEEE, MMM d yyyy')}
              {isBranchAdmin && <span className="ml-1 text-primary font-medium">• Branch Admin</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ColorSchemePicker />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* ────── Revenue Hero Card ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-4 -right-12 w-32 h-32 rounded-full bg-primary-foreground/5" />
          <div className="relative z-10">
            <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-1">
              {isBranchAdmin ? "Your Branch — Today's Revenue" : "Today's Revenue"}
            </p>
            {statsLoading ? (
              <Skeleton className="h-10 w-40 bg-primary-foreground/20" />
            ) : (
              <p className="text-4xl font-extrabold tracking-tight">KES {stats?.todaySales?.toLocaleString() || '0'}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-primary-foreground/70 flex items-center gap-1">
                <QrCode className="h-3 w-3" /> M-Pesa: <b>KES {stats?.todayMpesa?.toLocaleString() || '0'}</b>
              </span>
              <span className="text-xs text-primary-foreground/70 flex items-center gap-1">
                💵 Cash: <b>KES {stats?.todayCash?.toLocaleString() || '0'}</b>
              </span>
            </div>
            <p className="text-sm mt-1 text-primary-foreground/60">
              {stats?.todayOrderCount || 0} order{(stats?.todayOrderCount || 0) !== 1 ? 's' : ''} today
            </p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="bg-primary-foreground/15 rounded-2xl px-4 py-2">
                <p className="text-[10px] text-primary-foreground/60 uppercase">Monthly</p>
                <p className="text-lg font-bold">KES {stats?.totalSales?.toLocaleString() || '0'}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[9px] text-primary-foreground/50">M-Pesa: {stats?.monthMpesa?.toLocaleString() || '0'}</span>
                  <span className="text-[9px] text-primary-foreground/50">Cash: {stats?.monthCash?.toLocaleString() || '0'}</span>
                </div>
              </div>
              <div className="bg-primary-foreground/15 rounded-2xl px-4 py-2">
                <p className="text-[10px] text-primary-foreground/60 uppercase">All-Time</p>
                <p className="text-lg font-bold">KES {stats?.allTimeSales?.toLocaleString() || '0'}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[9px] text-primary-foreground/50">M-Pesa: {stats?.allTimeMpesa?.toLocaleString() || '0'}</span>
                  <span className="text-[9px] text-primary-foreground/50">Cash: {stats?.allTimeCash?.toLocaleString() || '0'}</span>
                </div>
              </div>
              <div className="bg-primary-foreground/15 rounded-2xl px-4 py-2">
                <p className="text-[10px] text-primary-foreground/60 uppercase">Trend</p>
                <div className="flex items-center gap-1">
                  {(stats?.salesChange || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-lg font-bold">{stats?.salesChange || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ────── Quick Stats Grid ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.12 }}
          className="grid grid-cols-3 gap-3"
        >
          <button onClick={() => navigate('/admin/orders')} className="bg-card rounded-2xl p-4 shadow-sm text-left border border-border hover:border-primary/30 transition-colors">
            <ShoppingCart className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.activeOrders || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Active Orders</p>
          </button>
          <button onClick={() => navigate('/admin/orders')} className="bg-card rounded-2xl p-4 shadow-sm text-left border border-border hover:border-primary/30 transition-colors relative">
            <Bell className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.newRequests || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">New Requests</p>
            {(stats?.newRequests || 0) > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
          <button onClick={() => navigate('/admin/inventory')} className="bg-card rounded-2xl p-4 shadow-sm text-left border border-border hover:border-primary/30 transition-colors">
            <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats?.lowStockCount || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Low Stock</p>
          </button>
        </motion.div>

        {/* ────── Sales Chart ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.19 }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Last 7 Days</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2" onClick={() => navigate('/admin/reports')}>
              Full Reports <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          {chartData ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-40 w-full rounded-xl" />
          )}
        </motion.div>

        {/* ────── Rider Overview ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.26 }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bike className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Rider Status</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2" onClick={() => navigate('/admin/riders')}>
              Manage <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{riderOverview?.online || 0}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Online</p>
            </div>
            <div className="flex-1 bg-amber-100 dark:bg-amber-950/30 rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{riderOverview?.busy || 0}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500">Busy</p>
            </div>
            <div className="flex-1 bg-muted rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-muted-foreground">{riderOverview?.offline || 0}</p>
              <p className="text-[10px] text-muted-foreground">Offline</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {riderOverview?.riders?.map(rider => (
              <div key={rider.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  rider.status === 'available' || rider.status === 'online'
                    ? 'bg-emerald-100 text-emerald-700'
                    : rider.activeDeliveries > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {rider.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{rider.name}</p>
                </div>
                {rider.activeDeliveries > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                    {rider.activeDeliveries} delivery
                  </Badge>
                )}
                <span className={`w-2 h-2 rounded-full ${
                  rider.status === 'available' || rider.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`} />
              </div>
            ))}
            {(!riderOverview?.riders || riderOverview.riders.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-3">No riders registered yet</p>
            )}
          </div>
        </motion.div>

        {/* ────── Live Order Feed ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.33 }}
          className="bg-card rounded-2xl p-4 shadow-sm border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Live Orders</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2" onClick={() => navigate('/admin/orders')}>
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {ordersLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="flex-1"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))
            ) : recentOrders?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isBranchAdmin ? 'No orders for your branch yet' : 'No orders yet'}</p>
              </div>
            ) : (
              recentOrders?.map((order) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate('/admin/orders')}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.customer_name || 'Customer'}</p>
                      <p className="text-[11px] text-muted-foreground">{getTimeAgo(order.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">KES {order.total_amount.toLocaleString()}</p>
                      <Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ────── Danger Zone (Main Admin only) ────── */}
        {isMainAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
            className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive text-sm">Danger Zone</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reset all orders, items, tracking, and rider assignments.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-3 gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      Reset All Orders
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">⚠️ Reset All Order Data?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This action <strong>cannot be undone</strong>. It will permanently delete:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>All orders and order items</li>
                          <li>All rider assignments</li>
                          <li>All order tracking records</li>
                        </ul>
                        <p className="text-destructive font-medium">Products and inventory will NOT be affected.</p>
                        <p className="mt-3">Type <strong>RESET</strong> to confirm:</p>
                        <Input
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder="Type RESET to confirm"
                          className="mt-2"
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setResetConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetData.mutate()}
                        disabled={resetConfirmText !== 'RESET' || resetData.isPending}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {resetData.isPending ? 'Resetting...' : 'Reset All Data'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
}
