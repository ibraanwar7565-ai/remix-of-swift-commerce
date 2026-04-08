import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { CartItem } from '@/types/store';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function CartItemRow({ item, index, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const hasDiscount = item.product.original_price && item.product.original_price > item.product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-3 p-3 bg-card rounded-xl border border-border/50"
    >
      {/* Product Image */}
      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {item.product.image_url ? (
          <LazyImage
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🥬
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm line-clamp-1">
              {item.product.name}
            </h4>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">
                {item.product.unit || item.product.category}
              </p>
              {hasDiscount && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {item.product.discount_percent}% off
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1"
            onClick={() => onRemove(item.product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span className="font-bold text-foreground">
              KES {(item.product.price * item.quantity).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through ml-1.5">
                KES {(item.product.original_price! * item.quantity).toLocaleString()}
              </span>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-border"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-5 text-center font-semibold text-sm">
              {item.quantity}
            </span>
            <Button
              size="icon"
              className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.inventory_count}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}