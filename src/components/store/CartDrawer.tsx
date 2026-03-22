import { Minus, Plus, Trash2, Tag, ArrowRight, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { CheckoutForm } from './CheckoutForm';
import { CartItemRow } from './CartItemRow';

const FREE_DELIVERY_THRESHOLD = 0;
const DELIVERY_FEE = 0;

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  const subtotal = getTotalPrice();
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  // Calculate total savings from discounted items
  const totalSavings = items.reduce((acc, item) => {
    if (item.product.original_price && item.product.original_price > item.product.price) {
      return acc + (item.product.original_price - item.product.price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md border-l-0 shadow-elevated">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-left">
                  {showCheckout ? 'Checkout' : 'Your Cart'}
                </SheetTitle>
                {!showCheckout && items.length > 0 && (
                  <p className="text-xs text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            {!showCheckout && items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive font-medium h-8"
                onClick={clearCart}
              >
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        {showCheckout ? (
          <CheckoutForm onBack={() => setShowCheckout(false)} />
        ) : (
          <>
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-5"
                >
                  <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground mb-1">Your cart is empty</p>
                <p className="text-muted-foreground text-center text-sm mb-6 max-w-[220px]">
                  Browse our fresh selection and add items to get started
                </p>
                <Button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full h-11 px-6"
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <>
                {/* Free Delivery Banner */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-5 py-3 bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary font-semibold">🎉 Free delivery on all orders!</p>
                  </div>
                </motion.div>

                {/* Savings Banner */}
                {totalSavings > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-3 px-3 py-2 bg-primary/10 rounded-lg flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-xs font-medium text-primary">
                      You're saving KES {totalSavings.toLocaleString()} on this order!
                    </p>
                  </motion.div>
                )}

                {/* Cart Items */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item, index) => (
                        <CartItemRow
                          key={item.product.id}
                          item={item}
                          index={index}
                          onRemove={removeFromCart}
                          onUpdateQuantity={updateQuantity}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Promo Code */}
                <div className="px-4 py-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-muted border-0 focus-visible:ring-primary/20"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      className="h-11 px-5 rounded-xl font-medium"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="px-4 py-4 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">KES {subtotal.toLocaleString()}</span>
                  </div>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground">Delivery</span>
                     <span className="font-medium text-primary">Free</span>
                   </div>
                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">Savings</span>
                      <span className="font-medium text-primary">-KES {totalSavings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">KES {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="p-4">
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full h-14 rounded-2xl text-base font-semibold shadow-button hover:shadow-button-hover transition-all"
                      onClick={() => setShowCheckout(true)}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}