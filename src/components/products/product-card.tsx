'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/mock-data';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <CardHeader className="p-0">
          <div className="aspect-square relative">
            <Image
              src={product.imageUrl}
              alt={product.name}
              data-ai-hint="clothing item"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="font-headline text-xl mb-1">{product.name}</CardTitle>
          <CardDescription>{product.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center mt-auto">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-primary">{product.price.toFixed(2)} FCFA</p>
            {product.originalPrice && (
              <p className="text-sm text-muted-foreground line-through">{product.originalPrice.toFixed(2)} FCFA</p>
            )}
          </div>
          <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
