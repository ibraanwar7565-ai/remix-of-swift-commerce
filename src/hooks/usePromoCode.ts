import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PromoResult {
  valid: boolean;
  discount: number;
  message: string;
  promoId?: string;
  code?: string;
}

export function usePromoCode() {
  const { user } = useAuth();
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCode = useCallback(async (code: string, subtotal: number): Promise<PromoResult> => {
    if (!code.trim()) return { valid: false, discount: 0, message: 'Enter a promo code' };

    setIsValidating(true);
    try {
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !promo) {
        const result = { valid: false, discount: 0, message: 'Invalid promo code' };
        setAppliedPromo(null);
        return result;
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        const result = { valid: false, discount: 0, message: 'This code has expired' };
        setAppliedPromo(null);
        return result;
      }

      // Check max uses
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        const result = { valid: false, discount: 0, message: 'This code has reached its limit' };
        setAppliedPromo(null);
        return result;
      }

      // Check min order
      if (promo.min_order_amount && subtotal < Number(promo.min_order_amount)) {
        const result = { valid: false, discount: 0, message: `Minimum order KES ${Number(promo.min_order_amount).toLocaleString()} required` };
        setAppliedPromo(null);
        return result;
      }

      // Check per-user usage
      if (user && promo.max_uses_per_user) {
        const { count } = await supabase
          .from('promo_code_uses')
          .select('id', { count: 'exact', head: true })
          .eq('promo_code_id', promo.id)
          .eq('user_id', user.id);

        if ((count || 0) >= promo.max_uses_per_user) {
          const result = { valid: false, discount: 0, message: 'You have already used this code' };
          setAppliedPromo(null);
          return result;
        }
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = Math.round(subtotal * Number(promo.discount_value) / 100);
      } else {
        discount = Number(promo.discount_value);
      }
      discount = Math.min(discount, subtotal); // Can't exceed subtotal

      const result: PromoResult = {
        valid: true,
        discount,
        message: promo.discount_type === 'percentage'
          ? `${promo.discount_value}% off — KES ${discount.toLocaleString()} saved!`
          : `KES ${discount.toLocaleString()} off!`,
        promoId: promo.id,
        code: promo.code,
      };
      setAppliedPromo(result);
      return result;
    } catch {
      const result = { valid: false, discount: 0, message: 'Failed to validate code' };
      setAppliedPromo(null);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [user]);

  const clearPromo = useCallback(() => setAppliedPromo(null), []);

  return { appliedPromo, isValidating, validateCode, clearPromo };
}
