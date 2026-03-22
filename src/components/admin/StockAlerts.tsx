import { AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockAlertsProps {
  products: any[];
}

export function StockAlerts({ products }: StockAlertsProps) {
  const outOfStock = products.filter(p => p.inventory_count <= 0 && p.is_active);
  const lowStock = products.filter(p => p.inventory_count > 0 && p.inventory_count <= 5 && p.is_active);

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="px-4 space-y-2 mb-2">
      {outOfStock.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <p className="font-semibold text-destructive">
              {outOfStock.length} Out of Stock
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map(p => (
              <Badge key={p.id} variant="destructive" className="text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">
              {lowStock.length} Low Stock (≤5 left)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <Badge key={p.id} variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                {p.name} — {p.inventory_count} left
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
