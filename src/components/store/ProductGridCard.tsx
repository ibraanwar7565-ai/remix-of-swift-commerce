import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Minus, Check, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/store';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useProductNotifications } from '@/hooks/useProductNotifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslateProduct } from '@/hooks/useTranslateProduct';

interface ProductGridCardProps {
  product: Product;
  index?: number;
}

export function ProductGridCard({ product, index = 0 }: ProductGridCardProps) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isSubscribed, subscribe, unsubscribe } = useProductNotifications();
  const { t } = useLanguage();
  const { useProductName } = useTranslateProduct();
  const translatedName = useProductName(product.name);
  const [isAdding, setIsAdding] = useState(false);
  
  const hasDiscount = product.discount_percent && product.discount_percent > 0;
  const displayPrice = hasDiscount && product.original_price 
    ? product.price 
    : product.price;
  const originalPrice = product.original_price || product.price;
  
  // Get current quantity in cart
  const cartItem = items.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!user) {
      toast.info(t('pleaseSignIn'), { duration: 3000 });
      navigate('/auth');
      return;
    }
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-200"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-muted/50 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
            🥬
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-sale text-white text-xs font-semibold px-2 py-0.5 rounded-lg shadow-sm">
            -{product.discount_percent}%
          </Badge>
        )}

        {/* Out of Stock Overlay */}
        {product.inventory_count === 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{t('outOfStock')}</span>
            {user && (
              <Button
                size="sm"
                variant={isSubscribed(product.id) ? "outline" : "default"}
                className="rounded-full text-xs h-7 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  isSubscribed(product.id) ? unsubscribe(product.id) : subscribe(product.id);
                }}
              >
                {isSubscribed(product.id) ? (
                  <><BellOff className="h-3 w-3" /> {t('subscribed')}</>
                ) : (
                  <><Bell className="h-3 w-3" /> {t('notifyMe')}</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (user) toggleFavorite(product.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all active:scale-90 ${
            isFavorite(product.id) 
              ? 'bg-sale text-white shadow-sm' 
              : 'bg-white/90 text-muted-foreground hover:text-sale hover:bg-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Name */}
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
          {translatedName}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((s) => (
            <svg key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        
        {/* Price Row */}
        <div className="flex items-end justify-between pt-1">
          <div>
            {hasDiscount && (
              <span className="text-[11px] text-muted-foreground line-through block">
                KES {originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="font-bold text-foreground text-base">
                KES {displayPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">
                /{product.unit || 'pc'}
              </span>
            </div>
          </div>
          
          {/* Add to Cart / Quantity Controls */}
          {quantity > 0 ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full border-border active:scale-90 transition-transform"
                onClick={() => {
                  if (quantity === 1) {
                    removeFromCart(product.id);
                  } else {
                    updateQuantity(product.id, quantity - 1);
                  }
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="w-5 text-center font-semibold text-xs">
                {quantity}
              </span>
              
              <Button
                size="icon"
                className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90 active:scale-90 transition-transform"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.inventory_count}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              className={`h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shadow-button transition-all active:scale-90 ${isAdding ? 'scale-110' : ''}`}
              onClick={handleAddToCart}
              disabled={product.inventory_count === 0}
            >
              {isAdding ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductGridCard);
