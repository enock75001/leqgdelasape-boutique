
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/mock-data';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For simplicity, add the first available variant to the cart from the product card.
    // A more complex implementation could open a dialog to select variants.
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.stock > 0) {
        addToCart(product, 1, firstVariant);
      } else {
        // Find first variant in stock
        const inStockVariant = product.variants.find(v => v.stock > 0);
        if (inStockVariant) {
          addToCart(product, 1, inStockVariant);
        } else {
          alert("Ce produit est en rupture de stock.");
        }
      }
    } else {
       alert("Ce produit n'a pas de variantes disponibles.");
    }
  };


  return (
    <Card className="group relative flex h-full w-full transform flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50">
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0 relative">
           {product.isNew && (
            <Badge className="absolute top-2 right-2 z-10">Nouveau</Badge>
          )}
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={product.imageUrls?.[0] || 'https://placehold.co/600x600.png'}
              alt={product.name}
              data-ai-hint="clothing item"
              layout="fill"
              objectFit="cover"
              className="transform transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="font-headline text-xl mb-1">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{product.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
           <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-primary">{Math.round(product.price)} FCFA</p>
                        {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">{Math.round(product.originalPrice)} FCFA</p>
                        )}
                    </div>
                </div>
                 <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform duration-200 group-hover:scale-105" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ajouter au panier
                </Button>
           </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
