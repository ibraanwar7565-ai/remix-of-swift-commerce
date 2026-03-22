export type ServiceType = 'grocery';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  unit: string | null;
  image_url: string | null;
  category: string | null;
  inventory_count: number;
  is_active: boolean;
  service_type: ServiceType;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  mpesa_checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  user_id: string | null;
  delivery_address_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}
