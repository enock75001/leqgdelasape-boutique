
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { recommendSimilarProducts } from '@/ai/flows/recommend-similar-products-flow';
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const product = docSnap.data() as Product;
      const firstImage = product.imageUrls?.[0] || 'https://placehold.co/1200x630.png';
      
      return {
        title: `${product.name} | LE QG DE LA SAPE`,
        description: product.description,
        openGraph: {
          title: product.name,
          description: product.description,
          images: [
            {
              url: firstImage,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ],
          siteName: 'LE QG DE LA SAPE',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: product.name,
          description: product.description,
          images: [firstImage],
        },
      }
    }
  } catch (error) {
    console.error("Failed to fetch product for metadata:", error);
  }

  // Fallback metadata
  return {
    title: 'Produit non trouvé',
    description: "L'élégance a son quartier général.",
  }
}


export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  
  useEffect(() => {
    const fetchProductAndRelated = async () => {
        if (!id) return;
        setLoading(true);
        setLoadingRelated(true);

        // Fetch main product
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const productData = { id: docSnap.id, ...docSnap.data() } as Product;
            setProduct(productData);
            
            // Set default selections for variants
            if (productData.variants?.length > 0) {
              const firstAvailableVariant = productData.variants.find(v => v.stock > 0);
              setSelectedVariant(firstAvailableVariant || productData.variants[0]);
            }
            
            setLoading(false); // Stop main loading indicator

            // Asynchronously fetch AI-powered related products
            try {
              const recommendedIds = await recommendSimilarProducts({
                productName: productData.name,
                productDescription: productData.description,
                productIdToExclude: productData.id,
              });
              
              if(recommendedIds.length > 0) {
                 const relatedProductsQuery = query(
                    collection(db, "products"),
                    where('__name__', 'in', recommendedIds)
                );
                const querySnapshot = await getDocs(relatedProductsQuery);
                const related = querySnapshot.docs.map(d => ({id: d.id, ...d.data()} as Product));
                setRelatedProducts(related);
              }

            } catch (aiError) {
                console.error("AI recommendation failed, falling back to random:", aiError);
                // Fallback to random products if AI fails
                const fallbackQuery = query(
                    collection(db, "products"), 
                    where("__name__", "!=", id),
                    limit(4)
                );
                const fallbackSnapshot = await getDocs(fallbackQuery);
                const fallbackRelated = fallbackSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Product));
                setRelatedProducts(fallbackRelated);
            } finally {
               setLoadingRelated(false);
            }

        } else {
            notFound();
        }
    };

    fetchProductAndRelated();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) {
      alert("Veuillez sélectionner une taille.");
      return;
    };
    
    if (selectedVariant.stock <= 0) {
        alert("Cette taille est en rupture de stock.");
        return;
    }

    addToCart(product, 1, selectedVariant);
  };


  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
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
    <div className="bg-transparent">
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
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
                      <CarouselPrevious className="left-2 md:left-4" />
                      <CarouselNext className="right-2 md:right-4" />
                    </Carousel>
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-3xl md:text-5xl font-headline font-bold text-foreground mb-4">{product.name}</h1>
                    <p className="text-md md:text-lg text-muted-foreground mb-6">{product.description}</p>
                    
                    {/* Size Selector */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-semibold mb-3 text-md">Taille : {selectedVariant?.size}</h3>
                        <RadioGroup 
                          value={selectedVariant?.size} 
                          onValueChange={(size) => {
                            const newVariant = product.variants.find(v => v.size === size);
                            if (newVariant) setSelectedVariant(newVariant);
                          }}
                          className="flex flex-wrap gap-2"
                        >
                            {product.variants.map((variant, index) => (
                                <div key={index}>
                                    <RadioGroupItem value={variant.size} id={`size-${variant.size}`} className="peer sr-only" disabled={variant.stock <= 0} />
                                    <Label 
                                      htmlFor={`size-${variant.size}`}
                                      className={cn(
                                        "flex items-center justify-center rounded-md border-2 p-3 px-4 text-sm font-medium uppercase hover:bg-muted/50 cursor-pointer",
                                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:hover:bg-transparent peer-disabled:text-muted-foreground peer-disabled:border-muted",
                                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                                      )}
                                    >
                                      {variant.size}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                      </div>
                    )}


                    <div className="flex items-baseline gap-4 mb-8">
                        <p className="text-3xl md:text-4xl font-bold text-primary">{Math.round(product.price)} FCFA</p>
                        {product.originalPrice && (
                            <p className="text-xl md:text-2xl font-bold text-muted-foreground line-through">{Math.round(product.originalPrice)} FCFA</p>
                        )}
                    </div>
                    <Button size="lg" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock <= 0}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {selectedVariant?.stock ?? 0 > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
                    </Button>
                </div>
            </div>

            <div className="mt-24">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline">Vous pourriez aussi aimer</h2>
                </div>
                {loadingRelated ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[250px] w-full rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {relatedProducts.map(relatedProduct => (
                            <ProductCard key={relatedProduct.id} product={relatedProduct} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
