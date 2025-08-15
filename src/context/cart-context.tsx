
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Product, Variant } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type CartItem = {
  product: Product;
  quantity: number;
  variant: Variant;
  color?: string; // Ajout de la couleur
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, variant: Variant, color?: string) => void;
  removeFromCart: (productId: string, variant: Variant, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant: Variant, color?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product, quantity = 1, variant: Variant, color?: string) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => 
        item.product.id === product.id && 
        item.variant.size === variant.size &&
        item.color === color // Vérifier la couleur aussi
      );
      
      const price = variant.price ?? product.price;

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        newCart[existingItemIndex].product.price = price;
        return newCart;
      } else {
        const productWithCorrectPrice = { ...product, price };
        return [...prevCart, { product: productWithCorrectPrice, quantity, variant, color }];
      }
    });

    toast({
      title: "Ajouté au panier",
      description: `${product.name} (${variant.size}${color ? `, ${color}` : ''}) a été ajouté.`,
    });
  };

  const removeFromCart = (productId: string, variant: Variant, color?: string) => {
    setCart(prevCart => prevCart.filter(item => 
        !(item.product.id === productId && 
        item.variant.size === variant.size && 
        item.color === color)
    ));
    toast({
        title: "Retiré du panier",
        description: `L'article a été retiré de votre panier.`,
        variant: "destructive"
      });
  };

  const updateQuantity = (productId: string, quantity: number, variant: Variant, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant, color);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          (item.product.id === productId && 
           item.variant.size === variant.size && 
           item.color === color)
            ? { ...item, quantity } 
            : item
        )
      );
    }
  };
  
  const clearCart = () => {
    setCart([]);
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
