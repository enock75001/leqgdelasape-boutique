'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { Product } from '@/lib/mock-data';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const { id } = params;
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        setProduct(productData);
        
        // Fetch related products
        const q = query(
            collection(db, "products"), 
            where("__name__", "!=", id),
            limit(4)
        );
        const querySnapshot = await getDocs(q);
        const related = querySnapshot.docs.map(d => ({id: d.id, ...d.data()} as Product));
        setRelatedProducts(related);

      } else {
        notFound();
      }
      setLoading(false);
    };

    fetchProduct();
  }, [params]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12">
                <Skeleton className="aspect-square rounded-lg" />
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-12 w-48" />
                </div>
            </div>
        </div>
    )
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
                        <Image
                        src={product.imageUrl}
                        alt={product.name}
                        data-ai-hint="water bottle"
                        layout="fill"
                        objectFit="cover"
                        />
                    </div>
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">{product.name}</h1>
                    <p className="text-lg text-muted-foreground mb-6">{product.description}</p>
                    <div className="flex items-baseline gap-4 mb-8">
                        <p className="text-4xl font-bold text-primary">{product.price.toFixed(2)} FCFA</p>
                        {product.originalPrice && (
                            <p className="text-2xl font-bold text-muted-foreground line-through">{product.originalPrice.toFixed(2)} FCFA</p>
                        )}
                    </div>
                    <Button size="lg" onClick={() => addToCart(product)}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                    </Button>
                </div>
            </div>

            <div className="mt-24">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-headline">You Might Also Like</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map(relatedProduct => (
                        <ProductCard key={relatedProduct.id} product={relatedProduct} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
