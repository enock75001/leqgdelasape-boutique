
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

  const discountPercentage = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
    
  // Calculate price range
  const prices = [
    product.price,
    ...(product.variants?.map(v => v.price).filter(p => p !== null && p !== undefined && p > 0) as number[] || [])
  ];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const priceDisplay = minPrice === maxPrice
    ? `${Math.round(minPrice)} FCFA`
    : `${Math.round(minPrice)} - ${Math.round(maxPrice)} FCFA`;


  return (
    <Card className="group relative flex h-full w-full transform flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-primary/30">
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0 relative">
           {product.isNew && (
            <Badge className="absolute top-2 right-2 z-10">Nouveau</Badge>
          )}
          {discountPercentage && (
             <Badge variant="destructive" className="absolute top-2 left-2 z-10">-{discountPercentage}%</Badge>
          )}
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={product.imageUrls?.[0] || 'https://placehold.co/600x600.png'}
              alt={product.name}
              data-ai-hint="clothing item"
              layout="fill"
              objectFit="cover"
              className="transform transition-transform duration-500 ease-in-out group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="font-headline text-xl mb-1 leading-tight">{product.name}</CardTitle>
          <div className='flex flex-wrap gap-1 mt-2'>
            {product.categories?.map(cat => <Badge key={cat} variant='secondary' className='font-normal text-xs'>{cat}</Badge>)}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
           <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-primary">{priceDisplay}</p>
                        {product.originalPrice && minPrice === maxPrice && (
                        <p className="text-sm text-muted-foreground line-through">{Math.round(product.originalPrice)} FCFA</p>
                        )}
                    </div>
                </div>
                 <Button className="w-full transition-colors" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ajouter au panier
                </Button>
           </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
