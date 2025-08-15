

export type Variant = {
    size: string;
    stock: number;
    price?: number; // Prix spécifique pour cette variante
}

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  categories: string[];
  variants: Variant[];
  colors?: string[]; // Champ pour les couleurs, séparé des variantes
  showColors?: boolean; // Interrupteur pour afficher ou non les couleurs
  isNew?: boolean;
  averageRating?: number;
  reviewCount?: number;
};

export type Review = {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number; // 1 to 5
    comment: string;
    createdAt: any; // Firestore Timestamp
};


export type Category = {
    id: string;
    name: string;
    parentId?: string | null;
    subcategories?: Category[];
    isVisible?: boolean;
};

export type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number; // Le prix au moment de l'achat
    variant: Variant;
    color?: string; // Ajout de la couleur choisie
    imageUrl?: string;
}

export type Order = {
    id: string;
    userId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
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
    phone?: string;
    role: 'admin' | 'manager' | 'client';
    registeredAt: string;
    avatarUrl: string;
};

export type Coupon = {
    id: string;
    code: string;
    discount: number; // as a fixed amount in FCFA
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

export type Announcement = {
    id: string;
    message: string;
    type: 'promotion' | 'info' | 'warning';
    enabled: boolean;
    link?: string;
};

export type Promotion = {
    id: string;
    title: string;
    description: string;
    image: string;
    hint: string;
    link: string;
    enabled: boolean;
}

export type SiteInfo = {
    facebookUrl?: string;
    tiktokUrl?: string;
    customerServicePhone?: string;
    storeAddress?: string;
    whatsappNumber?: string;
}

export const revenueData = [
  { month: "January", revenue: 18600 },
  { month: "February", revenue: 30500 },
  { month: "March", revenue: 23700 },
  { month: "April", revenue: 27800 },
  { month: "May", revenue: 29900 },
  { month: "June", revenue: 45231 },
]
