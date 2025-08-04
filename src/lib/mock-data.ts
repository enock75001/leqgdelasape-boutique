

export type Variant = {
    size: string;
    color: string;
    stock: number;
}

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  category: string;
  variants: Variant[];
};

export type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    variant: Variant;
}

export type Order = {
    id: string;
    userId: string | null;
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    date: string;
    total: number;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    items: OrderItem[];
    shippingMethod: string;
    shippingCost: number;
    paymentMethod: string;
}

export type User = {
    id: string;
    name: string;
    email: string;
    registeredAt: string;
    avatarUrl: string;
}

export type Coupon = {
    id: string;
    code: string;
    discount: number; // as a percentage
    expiresAt: string;
}

export type PaymentMethod = {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
}

export type ShippingMethod = {
    id: string;
    name: string;
    price: number;
    enabled: boolean;
}

export const revenueData = [
  { month: "January", revenue: 18600 },
  { month: "February", revenue: 30500 },
  { month: "March", revenue: 23700 },
  { month: "April", revenue: 27800 },
  { month: "May", revenue: 29900 },
  { month: "June", revenue: 45231 },
]
