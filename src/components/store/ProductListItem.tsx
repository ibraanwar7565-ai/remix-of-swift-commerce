import { motion } from 'framer-motion';
import { Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/store';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductListItemProps {
  product: Product;
  index?: number;
}

export function ProductListItem({ product, index = 0 }: ProductListItemProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!user) {
      toast.info('Please sign in to add items to your cart', { duration: 3000 });
      navigate('/auth');
      return;
    }
    addToCart(product);
  };
  const isLowStock = product.inventory_count <= 5 && product.inventory_count > 0;
  const isOrganic = product.category?.toLowerCase().includes('organic') || 
                    product.name.toLowerCase().includes('organic');
  const isSale = product.inventory_count > 10; // Mock sale logic

  // Mock rating for demo
  const rating = (4 + Math.random() * 0.9).toFixed(1);
  const reviewCount = Math.floor(50 + Math.random() * 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-shadow"
    >
      {/* Product Image */}
      <div className="relative w-24 h-24 flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl bg-muted"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        
        {/* Badges */}
        {isOrganic && (
          <Badge className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
            Organic
          </Badge>
        )}
        {isSale && !isOrganic && (
          <Badge className="absolute top-1 left-1 bg-sale text-white text-[10px] px-1.5 py-0.5">
            Sale
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <h3 className="font-semibold text-foreground text-sm line-clamp-1">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3.5 h-3.5 fill-star text-star" />
          <span className="text-xs font-medium text-foreground">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          <span className="text-lg font-bold text-foreground">
            KES {product.price.toLocaleString()}
          </span>
          {product.description && (
            <span className="text-xs text-muted-foreground block">
              / {product.description.split(' ').slice(0, 2).join(' ')}
            </span>
          )}
        </div>

        {isLowStock && (
          <span className="text-xs text-sale mt-1">
            Only {product.inventory_count} left
          </span>
        )}
      </div>

      {/* Add Button */}
      <div className="flex items-center">
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-button"
          onClick={handleAddToCart}
          disabled={product.inventory_count === 0}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
