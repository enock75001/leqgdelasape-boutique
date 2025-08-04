
'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { Product, Variant } from '@/lib/mock-data';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
        if (!id) return;
        setLoading(true);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const productData = { id: docSnap.id, ...docSnap.data() } as Product;
            setProduct(productData);
            
            // Set default selections
            if (productData.variants?.length > 0) {
              const firstVariant = productData.variants[0];
              setSelectedSize(firstVariant.size);
              setSelectedColor(firstVariant.color);
            }
            
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
  }, [id]);

  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map(v => v.size))];
  }, [product]);

  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    // Filter colors based on selected size
    if (!selectedSize) return [];
    return [...new Set(product.variants.filter(v => v.size === selectedSize).map(v => v.color))];
  }, [product, selectedSize]);

  useEffect(() => {
    // If the selected color is not available for the newly selected size, reset it
    if (selectedColor && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0] || null);
    }
  }, [selectedSize, selectedColor, availableColors]);

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;

    const selectedVariant = product.variants.find(
      v => v.size === selectedSize && v.color === selectedColor
    );
    
    if (!selectedVariant) {
        // This should not happen if logic is correct, but as a fallback
        alert("Cette combinaison n'est pas disponible.");
        return;
    }
    
    if (selectedVariant.stock <= 0) {
        alert("Ce produit est en rupture de stock.");
        return;
    }

    addToCart(product, 1, selectedVariant);
  };


  if (loading) {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <Skeleton className="aspect-square rounded-lg bg-card" />
                  <div className="grid grid-cols-5 gap-2">
                      <Skeleton className="aspect-square rounded-lg bg-card" />
                      <Skeleton className="aspect-square rounded-lg bg-card" />
                  </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4 bg-card" />
                    <Skeleton className="h-24 w-full bg-card" />
                    <Skeleton className="h-10 w-32 bg-card" />
                    <Skeleton className="h-12 w-48 bg-card" />
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
                   <Carousel className="w-full">
                      <CarouselContent>
                          {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ['https://placehold.co/600x600.png']).map((url, index) => (
                              <CarouselItem key={index}>
                                  <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg bg-card">
                                      <Image
                                          src={url}
                                          alt={`${product.name} - image ${index + 1}`}
                                          data-ai-hint="clothing item"
                                          layout="fill"
                                          objectFit="cover"
                                      />
                                  </div>
                              </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </Carousel>
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground mb-4">{product.name}</h1>
                    <p className="text-lg text-muted-foreground mb-6">{product.description}</p>
                    
                    {/* Size Selector */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Taille : {selectedSize}</h3>
                        <div className="flex flex-wrap gap-2">
                            {availableSizes.map(size => (
                                <Button key={size} variant={selectedSize === size ? 'default' : 'outline'} onClick={() => setSelectedSize(size)}>
                                    {size}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selector */}
                    <div className="mb-8">
                        <h3 className="font-semibold mb-2">Couleur : {selectedColor}</h3>
                        <div className="flex flex-wrap gap-2">
                            {availableColors.map(color => (
                                <Button key={color} variant={selectedColor === color ? 'default' : 'outline'} onClick={() => setSelectedColor(color)}>
                                    <span className="h-4 w-4 rounded-full border mr-2" style={{backgroundColor: color}}></span>
                                    {color}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-baseline gap-4 mb-8">
                        <p className="text-4xl font-bold text-primary">{product.price.toFixed(2)} FCFA</p>
                        {product.originalPrice && (
                            <p className="text-2xl font-bold text-muted-foreground line-through">{product.originalPrice.toFixed(2)} FCFA</p>
                        )}
                    </div>
                    <Button size="lg" onClick={handleAddToCart} disabled={!selectedSize || !selectedColor}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Ajouter au panier
                    </Button>
                </div>
            </div>

            <div className="mt-24">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl font-headline">Vous pourriez aussi aimer</h2>
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
