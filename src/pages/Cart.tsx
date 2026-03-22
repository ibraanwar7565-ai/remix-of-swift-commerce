import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Tag, Phone, MapPin, Wallet, CreditCard, Lock, Loader2, CheckCircle2, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { CartProvider } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/store/BottomNav';
import { DeliveryDetailsSheet, type DeliveryDetails } from '@/components/store/DeliveryDetailsSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserBranch } from '@/hooks/useUserBranch';

const deliveryTimes = [
  { id: 'asap', label: 'ASAP', sublabel: '~30 min' },
  { id: 'today-10-12', label: '10-12 PM', sublabel: 'Today' },
  { id: 'today-2-4', label: '2-4 PM', sublabel: 'Today' },
  { id: 'today-4-6', label: '4-6 PM', sublabel: 'Today' },
];

const paymentMethods = [
  { id: 'mpesa', label: 'M-Pesa', description: 'Pay via mobile money', icon: Phone, color: 'bg-[hsl(140,60%,40%)]' },
  { id: 'cash', label: 'Cash on Delivery', description: 'Pay when order arrives', icon: Wallet, color: 'bg-[hsl(35,80%,50%)]' },
];

const DELIVERY_FEE = 0;
const SERVICE_FEE = 0;

function CartContent() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { user, profile } = useAuth();
  const { selectedBranch } = useUserBranch();
  const [promoCode, setPromoCode] = useState('');
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('asap');
  const [selectedPayment, setSelectedPayment] = useState('mpesa');
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    name: profile?.full_name || '',
    address: 'Nairobi, Kenya',
  });

  const subtotal = getTotalPrice();
  const deliveryFee = 0;
  const serviceFee = 0;
  const total = subtotal;

  const totalSavings = items.reduce((acc, item) => {
    if (item.product.original_price && item.product.original_price > item.product.price) {
      return acc + (item.product.original_price - item.product.price) * item.quantity;
    }
    return acc;
  }, 0);

  const handlePlaceOrder = async () => {
    if (!deliveryDetails) {
      setShowDeliveryDetails(true);
      toast.error('Please add your delivery details');
      return;
    }

    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    let formattedPhone = formData.phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    setIsProcessing(true);

    try {
      // Check for existing draft order to upgrade
      const draftOrderId = localStorage.getItem('hallofresh_draft_order_id');
      let order: any;

      if (draftOrderId) {
        const { data } = await supabase
          .from('orders')
          .update({
            customer_phone: formattedPhone,
            customer_name: formData.name || null,
            customer_email: user?.email || null,
            total_amount: total,
            status: 'pending',
            payment_method: selectedPayment,
            branch_id: selectedBranch?.branch_id || null,
          })
          .eq('id', draftOrderId)
          .eq('status', 'unpaid')
          .select()
          .maybeSingle();
        if (data) {
          order = data;
          await supabase.from('order_items').delete().eq('order_id', draftOrderId);
        }
      }

      if (!order) {
        const { data, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_phone: formattedPhone,
            customer_name: formData.name || null,
            customer_email: user?.email || null,
            total_amount: total,
            status: 'pending',
            user_id: user?.id || null,
            payment_method: selectedPayment,
            branch_id: selectedBranch?.branch_id || null,
          })
          .select()
          .single();
        if (orderError) throw orderError;
        order = data;
      }

      localStorage.removeItem('hallofresh_draft_order_id');

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (selectedPayment === 'cash') {
        toast.success('Order placed! You will pay cash on delivery. 🎉');
        clearCart();
        navigate('/orders');
      } else {
        const { data: mpesaResult, error: mpesaError } = await supabase.functions.invoke('mpesa-stk-push', {
          body: {
            orderId: order.id,
            phone: formattedPhone,
            amount: Math.ceil(total),
          },
        });

        if (mpesaError) throw mpesaError;

        if (mpesaResult.success) {
          toast.success('M-Pesa payment request sent! Check your phone. 📱');
          clearCart();
          navigate('/orders');
        } else {
          throw new Error(mpesaResult.message || 'Payment initiation failed');
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background pb-24 flex flex-col items-center">
        <header className="sticky top-0 z-40 bg-background border-b border-border w-full">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/store')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">My Cart</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-6">Browse our fresh grocery selection</p>
          <Button className="rounded-full px-8" onClick={() => navigate('/grocery')}>
            🛒 Start Shopping
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24 flex flex-col items-center">
      <header className="sticky top-0 z-40 bg-background border-b border-border w-full">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => step === 'checkout' ? setStep('cart') : navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">
              {step === 'checkout' ? 'Checkout' : `My Cart (${items.length})`}
            </h1>
          </div>
          {step === 'cart' && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={clearCart}>
              Clear
            </Button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 'cart' ? (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-4 py-4 space-y-4 w-full max-w-2xl mx-auto"
          >
            {/* Cart Items */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Grocery Items</span>
              </div>
              <div className="divide-y divide-border">
                {items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-4">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🥬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">KES {item.product.price.toLocaleString()}/{item.product.unit || 'each'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">KES {(item.product.price * item.quantity).toLocaleString()}</p>
                      <button onClick={() => removeFromCart(item.product.id)} className="mt-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings */}
            {totalSavings > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 rounded-xl">
                <span className="text-sm font-medium text-primary">🎉 You're saving KES {totalSavings.toLocaleString()}!</span>
              </div>
            )}

            {/* Promo Code */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 h-11 rounded-xl bg-secondary">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Add promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <Button variant="outline" className="rounded-xl border-primary text-primary" onClick={() => toast.info('Promo codes coming soon!')}>
                Apply
              </Button>
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
              <h3 className="text-base font-semibold mb-2">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="text-primary font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="text-primary font-medium">Free</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary">Savings</span>
                  <span className="text-primary">-KES {totalSavings.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">KES {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Proceed to Checkout */}
            <Button
              className="w-full h-14 rounded-2xl text-base font-bold"
              onClick={() => setStep('checkout')}
            >
              Proceed to Checkout — KES {total.toLocaleString()}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-4 py-4 space-y-5 w-full max-w-2xl mx-auto pb-40"
          >
            {/* Delivery Address */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">📍 Delivery Address</h3>
              <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                className="w-full p-4 bg-card rounded-xl border-2 border-primary flex items-center gap-3 text-left"
                onClick={() => setShowDeliveryDetails(true)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {deliveryDetails ? deliveryDetails.buildingName || 'Delivery Location' : 'Add Delivery Address'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{formData.address}</p>
                  {deliveryDetails && (
                    <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {deliveryDetails.houseNumber}
                      {deliveryDetails.floor ? `, ${deliveryDetails.floor}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-primary font-medium text-sm flex-shrink-0">
                  {deliveryDetails ? 'Edit' : 'Add'}
                </span>
              </motion.button>
            </section>

            {/* Delivery Time */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">🕐 Delivery Time</h3>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {deliveryTimes.map((time) => (
                  <motion.button
                    key={time.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDeliveryTime(time.id)}
                    className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[80px] transition-all ${
                      selectedDeliveryTime === time.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{time.sublabel}</span>
                    <span className="text-sm font-semibold">{time.label}</span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">💳 Payment Method</h3>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPayment === method.id;

                  return (
                    <motion.button
                      key={method.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                        isSelected
                          ? 'border-2 border-primary bg-primary/5'
                          : 'border border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary' : 'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground text-sm">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* Your Details */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">👤 Your Details</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</Label>
                  <div className="relative mt-1">
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Amina Mohamed"
                      className="h-12 rounded-xl bg-secondary border-0 focus-visible:ring-primary/20"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
                    {selectedPayment === 'mpesa' ? 'M-Pesa Phone Number' : 'Phone Number'}
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712345678"
                      className="h-12 pl-10 rounded-xl bg-secondary border-0 focus-visible:ring-primary/20"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  {selectedPayment === 'mpesa' && (
                    <p className="text-xs text-muted-foreground mt-1.5">You'll receive an STK push on this number</p>
                  )}
                </div>
              </div>
            </section>

            {/* Order Total */}
            <div className="bg-card rounded-2xl p-4 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>KES {deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span>KES {serviceFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">KES {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order */}
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-14 rounded-2xl text-base font-bold shadow-button"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                ) : selectedPayment === 'cash' ? (
                  <>Place Order — KES {total.toLocaleString()}</>
                ) : (
                  <>Pay with M-Pesa — KES {total.toLocaleString()} <Lock className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </motion.div>
            <p className="text-center text-xs text-muted-foreground">
              {selectedPayment === 'cash' ? '💵 Pay cash when your order arrives' : '🔒 Secure payment via Safaricom M-Pesa'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <DeliveryDetailsSheet
        open={showDeliveryDetails}
        onOpenChange={setShowDeliveryDetails}
        address={formData.address}
        onConfirm={(details) => {
          setDeliveryDetails(details);
          setShowDeliveryDetails(false);
          toast.success('Delivery details saved!');
        }}
      />

      <BottomNav />
    </div>
  );
}

export default function CartPage() {
  return (
    <CartProvider>
      <CartContent />
    </CartProvider>
  );
}
