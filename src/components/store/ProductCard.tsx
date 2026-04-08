import { useNavigate } from 'react-router-dom';
import { LazyImage } from '@/components/ui/lazy-image';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/store';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLowStock = product.inventory_count <= 5;

  const handleAddToCart = () => {
    if (!user) {
      toast.info('Please sign in to add items to your cart', { duration: 3000 });
      navigate('/auth');
      return;
    }
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card className="group overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {product.image_url ? (
            <LazyImage
              src={product.image_url}
              alt={product.name}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {isLowStock && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="absolute right-2 top-2 bg-amber text-accent-foreground">
                Only {product.inventory_count} left
              </Badge>
            </motion.div>
          )}
          {product.category && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              {product.category}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 font-body text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <span className="font-display text-xl font-bold text-primary">
            KES {product.price.toLocaleString()}
          </span>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90"
              onClick={handleAddToCart}
              disabled={product.inventory_count === 0}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              Add
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
