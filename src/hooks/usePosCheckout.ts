import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/store';

export type PosPaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank';

export interface PosCartItem {
  product: Product;
  quantity: number;
}

export interface PosCheckoutInput {
  items: PosCartItem[];
  paymentMethod: PosPaymentMethod;
  customerName?: string;
  customerPhone?: string;
  discount: number;
  tax: number;
  branchId: string | null;
  cashierId?: string | null;
}

export interface PosSale {
  orderId: string;
  receiptNo: string;
  items: PosCartItem[];
  paymentMethod: PosPaymentMethod;
  customerName: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
}

/**
 * Records an in-store POS sale. A POS sale is fulfilled immediately, so the
 * order is created with status 'delivered' and the payment is written to the
 * `expenses` table (the same table the admin dashboard / reports read revenue
 * from). Inventory is decremented for each line item.
 */
export function usePosCheckout() {
  const queryClient = useQueryClient();

  return useMutation<PosSale, Error, PosCheckoutInput>({
    mutationFn: async (input) => {
      const subtotal = input.items.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0,
      );
      const total = Math.max(subtotal - input.discount + input.tax, 0);

      // 1. Create the order (fulfilled in-store → delivered)
      const orderPayload: Record<string, unknown> = {
        // RLS requires authenticated inserts to set user_id = auth.uid(),
        // so the order is attributed to the cashier processing the sale.
        user_id: input.cashierId ?? null,
        customer_phone: input.customerPhone?.trim() || 'WALK-IN',
        customer_name: input.customerName?.trim() || null,
        total_amount: total,
        status: 'delivered',
        payment_method: input.paymentMethod,
        discount_amount: input.discount || 0,
      };
      if (input.branchId) orderPayload.branch_id = input.branchId;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();
      if (orderError) throw orderError;

      // 2. Order line items
      const orderItems = input.items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price,
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      // 3. Record revenue so it shows up on the dashboard & reports
      const expensePayload: Record<string, unknown> = {
        order_id: order.id,
        amount: total,
        type: input.paymentMethod === 'mpesa' ? 'mpesa_payment' : 'cash_collection',
        description: `POS sale (${input.paymentMethod})`,
      };
      if (input.branchId) expensePayload.branch_id = input.branchId;
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert(expensePayload);
      if (expenseError) {
        // Non-fatal: the sale still went through, revenue logging just failed.
        console.warn('POS expense insert failed:', expenseError.message);
      }

      // 4. Decrement inventory for each sold product
      await Promise.all(
        input.items.map((i) =>
          supabase
            .from('products')
            .update({
              inventory_count: Math.max(i.product.inventory_count - i.quantity, 0),
            })
            .eq('id', i.product.id),
        ),
      );

      return {
        orderId: order.id,
        receiptNo: order.id.slice(0, 8).toUpperCase(),
        items: input.items,
        paymentMethod: input.paymentMethod,
        customerName: input.customerName?.trim() || null,
        subtotal,
        discount: input.discount,
        tax: input.tax,
        total,
        createdAt: order.created_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sales-chart'] });
    },
  });
}
