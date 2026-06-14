import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import type { PosSale } from '@/hooks/usePosCheckout';
import type { Branch } from '@/hooks/useBranches';

const paymentLabels: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  bank: 'Bank Transfer',
};

interface ReceiptDialogProps {
  sale: PosSale | null;
  branch: Branch | null;
  cashierName: string;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptDialog({ sale, branch, cashierName, onClose, onNewSale }: ReceiptDialogProps) {
  if (!sale) return null;

  const companyName = branch?.name || 'HiCaffé';

  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
        {/* Success banner */}
        <div className="no-print bg-primary/10 px-6 pt-6 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Check className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Sale Complete</h2>
          <p className="text-sm text-muted-foreground">
            KES {sale.total.toLocaleString()} · {paymentLabels[sale.paymentMethod]}
          </p>
        </div>

        {/* Printable receipt */}
        <div
          id="pos-receipt-printable"
          className="max-h-[55vh] overflow-y-auto bg-white px-6 py-5 text-[13px] leading-relaxed text-black"
        >
          <div className="text-center">
            <p className="text-base font-extrabold tracking-wide">{companyName}</p>
            {branch?.address_line && <p className="text-xs">{branch.address_line}{branch.city ? `, ${branch.city}` : ''}</p>}
            {branch?.phone && <p className="text-xs">Tel: {branch.phone}</p>}
          </div>

          <div className="my-3 border-t border-dashed border-black/40" />

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Receipt #</span><span className="font-semibold">{sale.receiptNo}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')}</span></div>
            <div className="flex justify-between"><span>Cashier</span><span>{cashierName}</span></div>
            {sale.customerName && (
              <div className="flex justify-between"><span>Customer</span><span>{sale.customerName}</span></div>
            )}
          </div>

          <div className="my-3 border-t border-dashed border-black/40" />

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/30 text-left">
                <th className="pb-1 font-semibold">Item</th>
                <th className="pb-1 text-center font-semibold">Qty</th>
                <th className="pb-1 text-right font-semibold">Price</th>
                <th className="pb-1 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((i) => (
                <tr key={i.product.id} className="align-top">
                  <td className="py-1 pr-1">{i.product.name}</td>
                  <td className="py-1 text-center">{i.quantity}</td>
                  <td className="py-1 text-right">{i.product.price.toLocaleString()}</td>
                  <td className="py-1 text-right">{(i.product.price * i.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-3 border-t border-dashed border-black/40" />

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>KES {sale.subtotal.toLocaleString()}</span></div>
            {sale.discount > 0 && (
              <div className="flex justify-between"><span>Discount</span><span>− KES {sale.discount.toLocaleString()}</span></div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between"><span>Tax</span><span>KES {sale.tax.toLocaleString()}</span></div>
            )}
            <div className="mt-1 flex justify-between border-t border-black/40 pt-1 text-sm font-bold">
              <span>TOTAL</span><span>KES {sale.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1"><span>Paid via</span><span>{paymentLabels[sale.paymentMethod]}</span></div>
          </div>

          <div className="my-3 border-t border-dashed border-black/40" />
          <p className="text-center text-xs font-medium">Thank you for your visit! 🙏</p>
          <p className="text-center text-[10px] text-black/60">Powered by HiCaffé POS</p>
        </div>

        {/* Actions */}
        <div className="no-print flex gap-2 border-t border-border bg-background p-4">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button className="flex-1 gap-2" onClick={onNewSale}>
            <Plus className="h-4 w-4" /> New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
