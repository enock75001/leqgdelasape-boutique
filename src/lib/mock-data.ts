
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
};

export type Post = {
  id: string;
  author: string;
  authorImage: string;
  content: string;
  timestamp: string;
};

export type Order = {
    id: string;
    customerName: string;
    date: string;
    total: number;
    status: 'Pending' | 'Shipped' | 'Delivered';
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Pure Spring Water',
    description: 'Crisp and refreshing spring water, bottled at the source. 500ml.',
    price: 1.50,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 100,
    category: 'Eau de source',
  },
  {
    id: '2',
    name: 'Sparkling Mineral Water',
    description: 'Naturally carbonated mineral water with a hint of effervescence. 750ml.',
    price: 2.75,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 80,
    category: 'Eau pétillante',
  },
  {
    id: '3',
    name: 'Electrolyte Enhanced Water',
    description: 'For optimal hydration, enhanced with essential minerals. 1L.',
    price: 2.25,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 120,
    category: 'Eau améliorée',
  },
  {
    id: '4',
    name: 'pH Balanced Alkaline Water',
    description: 'Smooth and clean taste with a pH of 9.5+ for balanced hydration. 1L.',
    price: 3.00,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 50,
    category: 'Eau améliorée',
  },
  {
    id: '5',
    name: 'Organic Fruit Infused Water',
    description: 'A subtle hint of natural lemon and mint. No sugar, no calories. 500ml.',
    price: 2.00,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 75,
    category: 'Eau aromatisée',
  },
  {
    id: '6',
    name: 'Bulk Water Box - 5L',
    description: 'Convenient and eco-friendly packaging for your daily hydration needs.',
    price: 8.50,
    imageUrl: 'https://placehold.co/600x600.png',
    stock: 30,
    category: 'Grand format',
  },
];

export const communityPosts: Post[] = [
  {
    id: 'p1',
    author: 'Alice Johnson',
    authorImage: 'https://placehold.co/100x100.png',
    content: 'Just received my first order from LE BLEU! The Pure Spring Water is so crisp. Staying hydrated has never been this delightful. 💧 #hydrationgoals',
    timestamp: '2 hours ago',
  },
  {
    id: 'p2',
    author: 'Bob Williams',
    authorImage: 'https://placehold.co/100x100.png',
    content: 'The Sparkling Mineral Water is a game changer for my evening meals. A perfect, healthy alternative to soda.',
    timestamp: '5 hours ago',
  },
  {
    id: 'p3',
    author: 'Charlie Brown',
    authorImage: 'https://placehold.co/100x100.png',
    content: 'Big fan of the eco-friendly 5L Bulk Box. Less plastic waste and great tasting water. Highly recommend!',
    timestamp: '1 day ago',
  },
];


export const orders: Order[] = [
    {
        id: 'ORD-001',
        customerName: 'Jane Doe',
        date: '2024-05-20',
        total: 25.50,
        status: 'Delivered',
        items: [
            { productId: '1', productName: 'Pure Spring Water', quantity: 10, price: 1.50 },
            { productId: '3', productName: 'Electrolyte Enhanced Water', quantity: 5, price: 2.25 },
        ]
    },
    {
        id: 'ORD-002',
        customerName: 'John Smith',
        date: '2024-05-22',
        total: 11.00,
        status: 'Shipped',
        items: [
            { productId: '2', productName: 'Sparkling Mineral Water', quantity: 4, price: 2.75 },
        ]
    },
    {
        id: 'ORD-003',
        customerName: 'Emily Clark',
        date: '2024-05-23',
        total: 17.00,
        status: 'Pending',
        items: [
            { productId: '6', productName: 'Bulk Water Box - 5L', quantity: 2, price: 8.50 },
        ]
    },
    {
        id: 'ORD-004',
        customerName: 'Michael Brown',
        date: '2024-05-24',
        total: 6.00,
        status: 'Delivered',
        items: [
            { productId: '4', productName: 'pH Balanced Alkaline Water', quantity: 2, price: 3.00 },
        ]
    },
    {
        id: 'ORD-005',
        customerName: 'Sarah Wilson',
        date: '2024-05-25',
        total: 8.00,
        status: 'Shipped',
        items: [
            { productId: '5', productName: 'Organic Fruit Infused Water', quantity: 4, price: 2.00 },
        ]
    }
]

export const revenueData = [
  { month: "January", revenue: 18600 },
  { month: "February", revenue: 30500 },
  { month: "March", revenue: 23700 },
  { month: "April", revenue: 27800 },
  { month: "May", revenue: 29900 },
  { month: "June", revenue: 45231 },
]
