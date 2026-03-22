import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Product, CartItem } from '@/types/store';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CART_STORAGE_KEY = 'hallofresh_cart';
const DRAFT_ORDER_KEY = 'hallofresh_draft_order_id';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sync cart to database as "unpaid" draft order (debounced)
  useEffect(() => {
    if (!user) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      // Skip sync if tab is hidden to save resources
      if (document.hidden) return;
      const draftOrderId = localStorage.getItem(DRAFT_ORDER_KEY);

      try {
        if (items.length === 0) {
          if (draftOrderId) {
            await supabase.from('order_items').delete().eq('order_id', draftOrderId);
            await supabase.from('orders').delete().eq('id', draftOrderId).eq('status', 'unpaid');
            localStorage.removeItem(DRAFT_ORDER_KEY);
          }
          return;
        }

        const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        if (draftOrderId) {
          const { data: existing } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', draftOrderId)
            .eq('status', 'unpaid')
            .maybeSingle();

          if (existing) {
            await supabase.from('orders').update({ total_amount: totalAmount }).eq('id', draftOrderId);
            await supabase.from('order_items').delete().eq('order_id', draftOrderId);
            await supabase.from('order_items').insert(
              items.map(item => ({
                order_id: draftOrderId,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
              }))
            );
            return;
          }
        }

        // Create new draft order
        const { data: order } = await supabase
          .from('orders')
          .insert({
            customer_phone: user.phone || '0000000000',
            customer_email: user.email || null,
            total_amount: totalAmount,
            status: 'unpaid',
            user_id: user.id,
          })
          .select('id')
          .single();

        if (order) {
          localStorage.setItem(DRAFT_ORDER_KEY, order.id);
          await supabase.from('order_items').insert(
            items.map(item => ({
              order_id: order.id,
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: item.product.price,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to sync cart draft:', err);
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [items, user]);

  const addToCart = useCallback((product: Product) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.inventory_count) {
          toast.error('Not enough stock available');
          return prevItems;
        }
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevItems, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.inventory_count) }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    // Clean up draft order
    const draftOrderId = localStorage.getItem(DRAFT_ORDER_KEY);
    if (draftOrderId) {
      supabase.from('order_items').delete().eq('order_id', draftOrderId).then(() => {
        supabase.from('orders').delete().eq('id', draftOrderId).eq('status', 'unpaid');
      });
      localStorage.removeItem(DRAFT_ORDER_KEY);
    }
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
