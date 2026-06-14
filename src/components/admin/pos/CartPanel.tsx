import { Minus, Plus, Trash2, ShoppingCart, Loader2, Wallet, Smartphone, CreditCard, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PosCartItem, PosPaymentMethod } from '@/hooks/usePosCheckout';

const payments: { id: PosPaymentMethod; label: string; icon: typeof Wallet }[] = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'bank', label: 'Bank', icon: Landmark },
];

interface CartPanelProps {
  items: PosCartItem[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  discount: number;
  setDiscount: (v: number) => void;
  payment: PosPaymentMethod;
  setPayment: (v: PosPaymentMethod) => void;
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
  isProcessing: boolean;
}

export function CartPanel(props: CartPanelProps) {
  const {
    items, onInc, onDec, onRemove, onClear,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    discount, setDiscount, payment, setPayment,
    subtotal, tax, total, onCheckout, isProcessing,
  } = props;

  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Current Sale</h2>
        </div>
        {!isEmpty && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive">
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p className="text-sm">No items yet</p>
            <p className="text-xs">Tap products to add them</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.product.id} className="flex items-center gap-2 rounded-xl bg-background p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    KES {item.product.price.toLocaleString()} each
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onDec(item.product.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground active:scale-90"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onInc(item.product.id)}
                    disabled={item.quantity >= item.product.inventory_count}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground active:scale-90 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-foreground">
                  {(item.product.price * item.quantity).toLocaleString()}
                </div>
                <button onClick={() => onRemove(item.product.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer / checkout */}
      {!isEmpty && (
        <div className="space-y-3 border-t border-border p-3">
          {/* Customer (optional) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pos-cust-name" className="text-[10px] text-muted-foreground">Customer (optional)</Label>
              <Input
                id="pos-cust-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name"
                className="mt-0.5 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="pos-cust-phone" className="text-[10px] text-muted-foreground">Phone (optional)</Label>
              <Input
                id="pos-cust-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07..."
                className="mt-0.5 h-9 text-sm"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <Label className="text-[10px] text-muted-foreground">Payment Method</Label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {payments.map((p) => {
                const Icon = p.icon;
                const active = payment === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="pos-discount" className="text-xs text-muted-foreground">Discount (KES)</Label>
            <Input
              id="pos-discount"
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="h-9 w-28 text-right text-sm"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 rounded-xl bg-muted/40 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span><span>− KES {discount.toLocaleString()}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span><span>KES {tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
              <span>Total</span><span>KES {total.toLocaleString()}</span>
            </div>
          </div>

          <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={onCheckout} disabled={isProcessing}>
            {isProcessing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <>Charge KES {total.toLocaleString()}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
