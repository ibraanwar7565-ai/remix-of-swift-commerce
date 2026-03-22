import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Phone, MapPin, Clock, CreditCard, Wallet, Lock, CheckCircle2, Building2, XCircle, PartyPopper, AlertTriangle, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryDetailsSheet, type DeliveryDetails } from './DeliveryDetailsSheet';
import { playNotificationSound } from '@/lib/notificationSound';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';
import { usePromoCode } from '@/hooks/usePromoCode';

type PaymentStatus = 'idle' | 'processing' | 'waiting' | 'success' | 'failed';

function PaymentStatusScreen({ status, message, onClose, onRetry, countdown }: {
  status: 'waiting' | 'success' | 'failed';
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  countdown?: number;
}) {
  const isSuccess = status === 'success';
  const isWaiting = status === 'waiting';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-1 flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          isWaiting ? 'bg-muted' : isSuccess ? 'bg-primary/10' : 'bg-destructive/10'
        }`}
      >
        {isWaiting ? (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        ) : isSuccess ? (
          <PartyPopper className="w-10 h-10 text-primary" />
        ) : (
          <XCircle className="w-10 h-10 text-destructive" />
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        {isWaiting ? 'Waiting for Payment...' : isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mb-4 max-w-[260px]"
      >
        {message}
      </motion.p>

      {isWaiting && countdown !== undefined && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mb-8"
        >
          Checking again in {countdown}s...
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-2"
      >
        {isSuccess ? (
          <Button onClick={onClose} className="w-full h-12 rounded-xl font-semibold">
            Done
          </Button>
        ) : isWaiting ? (
          <Button variant="outline" onClick={onClose} className="w-full h-12 rounded-xl font-semibold">
            Cancel
          </Button>
        ) : (
          <>
            {onRetry && (
              <Button onClick={onRetry} className="w-full h-12 rounded-xl font-semibold">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="w-full h-12 rounded-xl font-semibold">
              Go Back
            </Button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

interface CheckoutFormProps {
  onBack: () => void;
}

const deliveryTimes = [
  { id: 'today-10-12', label: '10-12 PM', sublabel: 'Today' },
  { id: 'today-2-4', label: '2-4 PM', sublabel: 'Today' },
  { id: 'today-4-6', label: '4-6 PM', sublabel: 'Today' },
];

const paymentMethods = [
  { id: 'mpesa', label: 'M-Pesa', description: 'Mobile money', icon: Phone },
  { id: 'card', label: 'Card', description: 'Visa, Mastercard', icon: CreditCard },
  { id: 'cash', label: 'Cash', description: 'Pay on delivery', icon: Wallet },
];

// Delivery fee is now calculated dynamically via useDeliveryFee hook

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const { items, getTotalPrice, clearCart, setIsCartOpen } = useCart();
  const { user, profile } = useAuth();
  const { selectedBranch } = useUserBranch();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [lastFormData, setLastFormData] = useState<{ phone: string; total: number; orderId: string; checkoutRequestId?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollCountdown, setPollCountdown] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const { appliedPromo, isValidating, validateCode, clearPromo } = usePromoCode();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startPolling = (orderId: string, checkoutRequestId: string) => {
    setPaymentStatus('waiting');
    setPaymentMessage('Enter your M-Pesa PIN on your phone to complete the payment.');
    setPollCountdown(7);
    
    // Countdown timer
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setPollCountdown(prev => (prev > 0 ? prev - 1 : 7));
    }, 1000);

    // Poll every 7 seconds for up to 90 seconds using STK Query API
    let elapsed = 0;
    const POLL_INTERVAL = 7000;
    const MAX_POLL_TIME = 90000;

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      elapsed += POLL_INTERVAL;
      setPollCountdown(7);

      try {
        const { data: queryResult, error } = await supabase.functions.invoke('mpesa-query', {
          body: { checkoutRequestId, orderId },
        });

        if (error) throw error;

        if (queryResult?.status === 'completed') {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          clearCart();
          playNotificationSound('delivery');
          setPaymentStatus('success');
          setPaymentMessage(queryResult.message || 'Payment confirmed!');
        } else if (queryResult?.status === 'failed') {
          clearInterval(pollRef.current!);
          clearInterval(countdownRef.current!);
          setPaymentStatus('failed');
          setPaymentMessage(queryResult.message || 'Payment was cancelled or failed. Please try again.');
        }
        // else status === 'pending' — keep polling
      } catch (err) {
        console.error('Poll error:', err);
      }

      if (elapsed >= MAX_POLL_TIME) {
        clearInterval(pollRef.current!);
        clearInterval(countdownRef.current!);
        setPaymentStatus('failed');
        setPaymentMessage('Payment timed out. If you completed payment, your order will be updated shortly. Otherwise, please try again.');
      }
    }, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('today-10-12');
  const [selectedPayment, setSelectedPayment] = useState('mpesa');
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    name: profile?.full_name || '',
    address: 'Nairobi, Kenya',
    addressId: null as string | null,
  });

  // Fetch user's default address (and auto-fill delivery details on reorder)
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      if (data) {
        setFormData(prev => ({ ...prev, address: data.address_line, addressId: data.id }));
        // On reorder, auto-fill delivery details from saved address
        const isReorder = localStorage.getItem('hallofresh_reorder');
        if (isReorder) {
          localStorage.removeItem('hallofresh_reorder');
          setDeliveryDetails({
            buildingName: data.building_name || '',
            houseNumber: data.house_number || '',
            floor: data.floor || '',
            instructions: data.delivery_instructions || '',
          });
        }
      }
    };
    fetchDefaultAddress();
  }, [user]);

  const subtotal = getTotalPrice();
  const { fee: deliveryFee, isFree: isDeliveryFree, reason: deliveryReason } = useDeliveryFee({
    branchLat: selectedBranch ? -1.2921 : undefined, // Use branch coords when available
    branchLon: selectedBranch ? 36.8219 : undefined,
    subtotal,
  });
  const discount = appliedPromo?.discount || 0;
  const total = Math.max(subtotal + deliveryFee - discount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryDetails) {
      setShowDeliveryDetails(true);
      toast.error('Please add your delivery details');
      return;
    }

    // Phone is required for both M-Pesa and Cash
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
      // Both payment methods start as 'pending'
      const orderStatus = 'pending';

      // Save or update delivery address with details
      let addressId = formData.addressId;
      if (user && deliveryDetails) {
        if (addressId) {
          // Update existing address with delivery details
          await supabase
            .from('delivery_addresses')
            .update({
              building_name: deliveryDetails.buildingName || null,
              house_number: deliveryDetails.houseNumber || null,
              floor: deliveryDetails.floor || null,
              delivery_instructions: deliveryDetails.instructions || null,
            })
            .eq('id', addressId);
        } else {
          // Create a new delivery address with details
          const { data: newAddr } = await supabase
            .from('delivery_addresses')
            .insert({
              user_id: user.id,
              address_line: formData.address,
              city: 'Nairobi',
              building_name: deliveryDetails.buildingName || null,
              house_number: deliveryDetails.houseNumber || null,
              floor: deliveryDetails.floor || null,
              delivery_instructions: deliveryDetails.instructions || null,
              is_default: true,
            })
            .select('id')
            .single();
          if (newAddr) addressId = newAddr.id;
        }
      }

      // Check for existing draft order
      const draftOrderId = localStorage.getItem('hallofresh_draft_order_id');
      let order: any;

      if (draftOrderId) {
        // Upgrade the draft order
        const { data, error } = await supabase
          .from('orders')
          .update({
            customer_phone: formattedPhone,
            customer_name: formData.name || null,
            customer_email: user?.email || null,
            total_amount: total,
            status: orderStatus,
            delivery_address_id: addressId || null,
            payment_method: selectedPayment,
            branch_id: selectedBranch?.branch_id || null,
          })
          .eq('id', draftOrderId)
          .eq('status', 'unpaid')
          .select()
          .maybeSingle();

        if (data) {
          order = data;
          // Delete old items then re-insert
          await supabase.from('order_items').delete().eq('order_id', draftOrderId);
        }
      }

      if (!order) {
        // Create new order if no draft
        const orderPayload: any = {
          customer_phone: formattedPhone,
          customer_name: formData.name || null,
          customer_email: user?.email || null,
          total_amount: total,
          status: orderStatus,
          user_id: user?.id || null,
          delivery_address_id: addressId || null,
          payment_method: selectedPayment,
          branch_id: selectedBranch?.branch_id || null,
          promo_code_id: appliedPromo?.promoId || null,
          discount_amount: discount || 0,
        };

        const { data, error: orderError } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();
        if (orderError) throw orderError;
        order = data;
      }

      // Record promo code usage
      if (appliedPromo?.promoId && user && order) {
        await supabase.from('promo_code_uses').insert({
          promo_code_id: appliedPromo.promoId,
          user_id: user.id,
          order_id: order.id,
        });
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
        // Cash on delivery — order placed directly
        clearCart();
        playNotificationSound('delivery');
        setPaymentStatus('success');
        setPaymentMessage('Your order has been placed! You will pay cash on delivery.');
      } else {
        // M-Pesa payment
        setLastFormData({ phone: formattedPhone, total: Math.ceil(total), orderId: order.id, checkoutRequestId: '' });
        
        const { data: mpesaResult, error: mpesaError } = await supabase.functions.invoke('mpesa-stk-push', {
          body: {
            orderId: order.id,
            phone: formattedPhone,
            amount: Math.ceil(total),
          },
        });

        if (mpesaError) throw mpesaError;

        if (mpesaResult.success) {
          const crid = mpesaResult.checkoutRequestId;
          setLastFormData(prev => prev ? { ...prev, checkoutRequestId: crid } : prev);
          setIsProcessing(false);
          startPolling(order.id, crid);
        } else {
          throw new Error(mpesaResult.message || 'Payment initiation failed');
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setPaymentStatus('failed');
      setPaymentMessage(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!lastFormData) return;
    stopPolling();
    setPaymentStatus('idle');
    setIsProcessing(true);
    try {
      // Reset order status back to pending
      await supabase.from('orders').update({ status: 'pending' }).eq('id', lastFormData.orderId);

      const { data: mpesaResult, error: mpesaError } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          orderId: lastFormData.orderId,
          phone: lastFormData.phone,
          amount: lastFormData.total,
        },
      });

      if (mpesaError) throw mpesaError;

      if (mpesaResult.success) {
        const crid = mpesaResult.checkoutRequestId;
        setLastFormData(prev => prev ? { ...prev, checkoutRequestId: crid } : prev);
        setIsProcessing(false);
        startPolling(lastFormData.orderId, crid);
      } else {
        throw new Error(mpesaResult.message || 'Payment initiation failed');
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      setPaymentMessage(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'waiting' || paymentStatus === 'success' || paymentStatus === 'failed') {
    return (
      <AnimatePresence mode="wait">
        <PaymentStatusScreen
          status={paymentStatus as 'waiting' | 'success' | 'failed'}
          message={paymentMessage}
          countdown={paymentStatus === 'waiting' ? pollCountdown : undefined}
          onClose={() => {
            stopPolling();
            if (paymentStatus === 'success') {
              setIsCartOpen(false);
            } else {
              setPaymentStatus('idle');
            }
          }}
          onRetry={paymentStatus === 'failed' && lastFormData ? handleRetry : undefined}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      {/* Back Button */}
      <div className="px-4 py-2 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cart
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* Delivery Address */}
          <section>
            <h3 className="text-xs font-semibold text-foreground mb-1.5">Delivery Address</h3>
            <motion.button
              type="button"
              whileTap={{ scale: 0.99 }}
              className="w-full p-2.5 bg-card rounded-lg border-2 border-primary flex items-center gap-2.5 text-left"
              onClick={() => setShowDeliveryDetails(true)}
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs">
                  {deliveryDetails ? deliveryDetails.buildingName || 'Delivery Location' : 'Home'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{formData.address}</p>
                {deliveryDetails && (
                  <p className="text-[10px] text-primary mt-0.5 flex items-center gap-0.5">
                    <Building2 className="h-2.5 w-2.5" />
                    {deliveryDetails.houseNumber}
                    {deliveryDetails.floor ? `, ${deliveryDetails.floor}` : ''}
                  </p>
                )}
              </div>
              <span className="text-primary font-medium text-xs flex-shrink-0">
                {deliveryDetails ? 'Edit' : 'Add'}
              </span>
            </motion.button>
          </section>

          {/* Delivery Time */}
          <section>
            <h3 className="text-xs font-semibold text-foreground mb-1.5">Delivery Time</h3>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {deliveryTimes.map((time) => {
                const isSelected = selectedDeliveryTime === time.id;
                return (
                  <motion.button
                    key={time.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDeliveryTime(time.id)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[65px] transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{time.sublabel}</span>
                    <span className="text-xs font-semibold">{time.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h3 className="text-xs font-semibold text-foreground mb-1.5">Payment Method</h3>
            <div className="space-y-1.5">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPayment === method.id;
                
                return (
                  <motion.button
                    key={method.id}
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full p-2.5 rounded-lg flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground text-xs">{method.label}</p>
                      <p className="text-[10px] text-muted-foreground">{method.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Your Details */}
          <section>
            <h3 className="text-xs font-semibold text-foreground mb-1.5">Your Details</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="drawer-name" className="text-[10px] font-medium text-muted-foreground">Full Name</Label>
                <Input
                  id="drawer-name"
                  type="text"
                  placeholder="e.g. Amina Mohamed"
                  className="h-10 text-sm rounded-lg bg-muted border-0 focus-visible:ring-primary/20 mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="drawer-phone" className="text-[10px] font-medium text-muted-foreground">
                  {selectedPayment === 'mpesa' ? 'M-Pesa Phone Number' : 'Phone Number'}
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="drawer-phone"
                    type="tel"
                    placeholder="0712345678"
                    className="h-10 pl-9 text-sm rounded-lg bg-muted border-0 focus-visible:ring-primary/20"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Order Summary & Place Order */}
        <div className="mt-auto">
          {/* Promo Code Input */}
          <div className="px-3 py-2 border-t border-border/50">
            {appliedPromo?.valid ? (
              <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">{appliedPromo.code}</span>
                  <span className="text-xs text-muted-foreground">— {appliedPromo.message}</span>
                </div>
                <button onClick={() => { clearPromo(); setPromoInput(''); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value.toUpperCase())}
                  className="h-9 text-xs rounded-lg bg-muted border-0 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs rounded-lg"
                  disabled={!promoInput || isValidating}
                  onClick={() => validateCode(promoInput, subtotal)}
                >
                  {isValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
          </div>

          <div className="px-3 py-2.5 bg-muted/30 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Delivery {deliveryReason ? `(${deliveryReason})` : ''}
              </span>
              <span className="font-medium">
                {isDeliveryFree ? (
                  <span className="text-primary">Free</span>
                ) : (
                  `KES ${deliveryFee.toLocaleString()}`
                )}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary">Discount</span>
                <span className="font-medium text-primary">−KES {discount.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Total</span>
              <span className="text-base font-bold">KES {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-sm font-semibold shadow-button hover:shadow-button-hover transition-all"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedPayment === 'cash' ? (
                  <>Place Order — KES {total.toLocaleString()}</>
                ) : (
                  <>
                    Pay KES {total.toLocaleString()}
                    <Lock className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </motion.div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              {selectedPayment === 'cash' ? 'Pay cash when your order arrives' : 'Secure payment powered by M-Pesa'}
            </p>
          </div>
        </div>
      </form>

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
    </motion.div>
  );
}
