import { useState, useRef } from 'react';
import { Printer, Calendar, TrendingUp, Package, Truck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';

type ReportType = 'sales' | 'orders' | 'inventory' | 'riders';
type DateRange = 'today' | '7days' | '30days' | 'this_month' | 'last_month';

const reportTypes: { key: ReportType; label: string; icon: typeof TrendingUp; description: string }[] = [
  { key: 'sales', label: 'Sales Report', icon: TrendingUp, description: 'Revenue, transactions & payment summary' },
  { key: 'orders', label: 'Orders Report', icon: ShoppingCart, description: 'Order status breakdown & details' },
  { key: 'inventory', label: 'Inventory Report', icon: Package, description: 'Stock levels, low stock & product stats' },
  { key: 'riders', label: 'Rider Performance', icon: Truck, description: 'Deliveries, assignments & rider stats' },
];

const dateRanges: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
];

function getDateRange(range: DateRange): { from: Date; to: Date } {
  const now = new Date();
  switch (range) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) };
    case '7days': return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    case '30days': return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
    case 'this_month': return { from: startOfMonth(now), to: endOfDay(now) };
    case 'last_month': return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
  }
}

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('7days');
  const printRef = useRef<HTMLDivElement>(null);
  const { isBranchAdmin, branchId, isMainAdmin } = useUserRole();

  const { from, to } = getDateRange(dateRange);
  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', fromISO, toISO, branchId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('id, total_amount, status, created_at, customer_name, customer_phone, mpesa_checkout_request_id, branch_id')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      if (isBranchAdmin && branchId) query = query.eq('branch_id', branchId);
      const { data: orders, error } = await query;
      if (error) throw error;

      const completed = orders?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;

      // Payment breakdown
      const mpesaOrders = completed.filter(o => o.mpesa_checkout_request_id);
      const cashOrders = completed.filter(o => !o.mpesa_checkout_request_id);
      const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const cashTotal = cashOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

      // All-time revenue (branch-scoped)
      let allTimeQuery = supabase.from('orders').select('total_amount').eq('status', 'completed');
      if (isBranchAdmin && branchId) allTimeQuery = allTimeQuery.eq('branch_id', branchId);
      const { data: allTimeOrders } = await allTimeQuery;
      const allTimeRevenue = (allTimeOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);

      return {
        orders: orders || [],
        totalRevenue,
        avgOrder,
        completedCount: completed.length,
        totalOrders: orders?.length || 0,
        cancelledCount: orders?.filter(o => o.status === 'cancelled').length || 0,
        pendingCount: orders?.filter(o => o.status === 'pending').length || 0,
        mpesaTotal,
        cashTotal,
        mpesaCount: mpesaOrders.length,
        cashCount: cashOrders.length,
        allTimeRevenue,
      };
    },
    staleTime: 1000 * 60,
    enabled: selectedReport === 'sales' || selectedReport === 'orders',
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, inventory_count, is_active')
        .order('inventory_count', { ascending: true });
      if (error) throw error;

      const products = data || [];
      const lowStock = products.filter(p => p.inventory_count <= 10 && p.inventory_count > 0);
      const outOfStock = products.filter(p => p.inventory_count <= 0);
      const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.inventory_count), 0);

      return { products, lowStock, outOfStock, totalValue, totalProducts: products.length };
    },
    staleTime: 1000 * 60 * 2,
    enabled: selectedReport === 'inventory',
  });

  const { data: riderData, isLoading: riderLoading } = useQuery({
    queryKey: ['report-riders', fromISO, toISO, branchId],
    queryFn: async () => {
      let ridersQuery = supabase.from('riders').select('id, phone, status, user_id, branch_id');
      if (isBranchAdmin && branchId) ridersQuery = ridersQuery.eq('branch_id', branchId);
      const [assignmentsRes, ridersRes, profilesRes] = await Promise.all([
        supabase.from('rider_assignments').select('id, status, assigned_at, picked_up_at, delivered_at, rider_id').gte('assigned_at', fromISO).lte('assigned_at', toISO),
        ridersQuery,
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));

      const assignments = assignmentsRes.data || [];
      const riders = ridersRes.data || [];
      const deliveredCount = assignments.filter(a => a.status === 'delivered').length;

      const riderStats = riders.map(r => {
        const riderAssignments = assignments.filter((a: any) => a.rider_id === r.id);
        return {
          id: r.id,
          name: profileMap.get(r.user_id) || 'Rider',
          phone: r.phone,
          status: r.status,
          totalAssigned: riderAssignments.length,
          delivered: riderAssignments.filter(a => a.status === 'delivered').length,
        };
      });

      return { totalAssignments: assignments.length, deliveredCount, riderStats, totalRiders: riders.length };
    },
    staleTime: 1000 * 60,
    enabled: selectedReport === 'riders',
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const selectedLabel = reportTypes.find(r => r.key === selectedReport)?.label || 'Report';
    const rangeLabel = dateRanges.find(r => r.key === dateRange)?.label || '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>HalloFresh - ${selectedLabel}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
        .header h1 { font-size: 24px; color: #16a34a; margin-bottom: 4px; }
        .header p { font-size: 13px; color: #666; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-card .value { font-size: 22px; font-weight: 700; color: #16a34a; }
        .stat-card .label { font-size: 11px; color: #888; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        @media print { body { padding: 12px; } }
      </style></head><body>
        <div class="header"><h1>🥬 HalloFresh Grocery Mart</h1>
        <p>${selectedLabel} • ${rangeLabel} • Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}</p></div>
        ${content.innerHTML}
        <div class="footer"><p>HalloFresh Grocery Mart — Eastleigh, Nairobi | +254 719 482 565</p></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isLoading = salesLoading || inventoryLoading || riderLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Reports</h1>
            <p className="text-xs text-muted-foreground">Generate & print business reports</p>
          </div>
          <Button onClick={handlePrint} className="gap-2" disabled={isLoading}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {reportTypes.map((rt) => (
            <button
              key={rt.key}
              onClick={() => setSelectedReport(rt.key)}
              className={`p-3 rounded-xl text-left transition-colors border ${
                selectedReport === rt.key ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <rt.icon className={`h-5 w-5 mb-1 ${selectedReport === rt.key ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-sm font-semibold ${selectedReport === rt.key ? 'text-primary' : 'text-foreground'}`}>{rt.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{rt.description}</p>
            </button>
          ))}
        </div>

        {selectedReport !== 'inventory' && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dateRanges.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div ref={printRef}>
          {selectedReport === 'sales' && (
            <>
              {salesLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="stats-grid grid grid-cols-2 gap-3">
                    <SummaryCard label="Period Revenue" value={`KES ${salesData?.totalRevenue.toLocaleString()}`} />
                    <SummaryCard label="All-Time Revenue" value={`KES ${salesData?.allTimeRevenue?.toLocaleString() || '0'}`} />
                    <SummaryCard label="Completed Orders" value={String(salesData?.completedCount || 0)} />
                    <SummaryCard label="Avg Order Value" value={`KES ${Math.round(salesData?.avgOrder || 0).toLocaleString()}`} />
                  </div>
                  {/* Payment breakdown */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Card className="p-3 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                      <p className="text-xs text-muted-foreground uppercase">M-Pesa</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">KES {salesData?.mpesaTotal?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-muted-foreground">{salesData?.mpesaCount || 0} transactions</p>
                    </Card>
                    <Card className="p-3 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-xs text-muted-foreground uppercase">Cash</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">KES {salesData?.cashTotal?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-muted-foreground">{salesData?.cashCount || 0} transactions</p>
                    </Card>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Transaction Details</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-muted">
                          <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                        </tr></thead>
                        <tbody>
                          {salesData?.orders.slice(0, 50).map((o: any) => (
                            <tr key={o.id} className="border-t border-border">
                              <td className="p-3 text-muted-foreground">{format(new Date(o.created_at), 'MMM d, h:mm a')}</td>
                              <td className="p-3 font-medium">{o.customer_name || 'N/A'}</td>
                              <td className="p-3"><StatusBadge status={o.status} /></td>
                              <td className="p-3 text-right font-semibold">KES {Number(o.total_amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(salesData?.orders.length || 0) > 50 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">Showing 50 of {salesData?.orders.length} orders</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {selectedReport === 'orders' && (
            <>
              {salesLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="stats-grid grid grid-cols-3 gap-3">
                    <SummaryCard label="Total Orders" value={String(salesData?.totalOrders || 0)} />
                    <SummaryCard label="Completed" value={String(salesData?.completedCount || 0)} />
                    <SummaryCard label="Pending" value={String(salesData?.pendingCount || 0)} />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Order Breakdown</h3>
                    <div className="space-y-2">
                      {['pending', 'confirmed', 'processing', 'out_for_delivery', 'completed', 'cancelled'].map(status => {
                        const count = salesData?.orders.filter((o: any) => o.status === status).length || 0;
                        const total = salesData?.totalOrders || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <StatusBadge status={status} />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-semibold w-10 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-muted">
                        <th className="text-left p-3 font-medium text-muted-foreground">Order ID</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                      </tr></thead>
                      <tbody>
                        {salesData?.orders.slice(0, 50).map((o: any) => (
                          <tr key={o.id} className="border-t border-border">
                            <td className="p-3 text-muted-foreground font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                            <td className="p-3 font-medium">{o.customer_name || 'N/A'}</td>
                            <td className="p-3 text-muted-foreground">{o.customer_phone}</td>
                            <td className="p-3"><StatusBadge status={o.status} /></td>
                            <td className="p-3 text-right font-semibold">KES {Number(o.total_amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {selectedReport === 'inventory' && (
            <>
              {inventoryLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="stats-grid grid grid-cols-2 gap-3">
                    <SummaryCard label="Total Products" value={String(inventoryData?.totalProducts || 0)} />
                    <SummaryCard label="Stock Value" value={`KES ${inventoryData?.totalValue.toLocaleString()}`} />
                    <SummaryCard label="Low Stock" value={String(inventoryData?.lowStock.length || 0)} />
                    <SummaryCard label="Out of Stock" value={String(inventoryData?.outOfStock.length || 0)} />
                  </div>
                  {(inventoryData?.lowStock.length || 0) > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-destructive mb-2">⚠️ Low Stock Items</h3>
                      <div className="overflow-x-auto rounded-xl border border-destructive/20">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-destructive/5">
                            <th className="text-left p-3 font-medium">Product</th>
                            <th className="text-left p-3 font-medium">Category</th>
                            <th className="text-right p-3 font-medium">Stock</th>
                            <th className="text-right p-3 font-medium">Price</th>
                          </tr></thead>
                          <tbody>
                            {inventoryData?.lowStock.map((p: any) => (
                              <tr key={p.id} className="border-t border-border">
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3 text-muted-foreground">{p.category || '—'}</td>
                                <td className="p-3 text-right font-semibold text-destructive">{p.inventory_count}</td>
                                <td className="p-3 text-right">KES {Number(p.price).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">All Products</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-muted">
                          <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
                        </tr></thead>
                        <tbody>
                          {inventoryData?.products.map((p: any) => (
                            <tr key={p.id} className="border-t border-border">
                              <td className="p-3 font-medium">{p.name}</td>
                              <td className="p-3 text-muted-foreground">{p.category || '—'}</td>
                              <td className={`p-3 text-right font-semibold ${p.inventory_count <= 10 ? 'text-destructive' : 'text-foreground'}`}>{p.inventory_count}</td>
                              <td className="p-3 text-right">KES {Number(p.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {selectedReport === 'riders' && (
            <>
              {riderLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="stats-grid grid grid-cols-3 gap-3">
                    <SummaryCard label="Total Riders" value={String(riderData?.totalRiders || 0)} />
                    <SummaryCard label="Assignments" value={String(riderData?.totalAssignments || 0)} />
                    <SummaryCard label="Delivered" value={String(riderData?.deliveredCount || 0)} />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Rider Performance</h3>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-muted">
                          <th className="text-left p-3 font-medium text-muted-foreground">Rider</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Assigned</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Delivered</th>
                        </tr></thead>
                        <tbody>
                          {riderData?.riderStats.map((r: any) => (
                            <tr key={r.id} className="border-t border-border">
                              <td className="p-3 font-medium">{r.name}</td>
                              <td className="p-3 text-muted-foreground">{r.phone}</td>
                              <td className="p-3">
                                <Badge className={r.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>{r.status}</Badge>
                              </td>
                              <td className="p-3 text-right">{r.totalAssigned}</td>
                              <td className="p-3 text-right font-semibold">{r.delivered}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <AdminBottomNav />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-emerald-100 text-emerald-700',
    processing: 'bg-blue-100 text-blue-700', out_for_delivery: 'bg-purple-100 text-purple-700',
    completed: 'bg-primary/10 text-primary', cancelled: 'bg-destructive/10 text-destructive',
    delivered: 'bg-primary/10 text-primary',
  };
  const labels: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Preparing',
    out_for_delivery: 'On the Way', completed: 'Delivered', cancelled: 'Cancelled', delivered: 'Delivered',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || status}
    </span>
  );
}
