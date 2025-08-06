'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { ShoppingCart, Twitter, Facebook } from 'lucide-react';
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
import { Separator } from '../ui/separator';

interface ProductDetailClientProps {
    product: Product;
}

// SVG for WhatsApp, as it's not in lucide-react
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [productUrl, setProductUrl] = useState('');


  useEffect(() => {
    // This code runs only in the browser, so `window.location.href` is safe
    setProductUrl(window.location.href);

    // Set default selections for variants when product is available
    if (product.variants?.length > 0) {
        const firstAvailableVariant = product.variants.find(v => v.stock > 0);
        setSelectedVariant(firstAvailableVariant || product.variants[0]);
    }

    const fetchRelated = async () => {
        setLoadingRelated(true);
        try {
            const recommendedIds = await recommendSimilarProducts({
            productName: product.name,
            productDescription: product.description,
            productIdToExclude: product.id,
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
            const fallbackQuery = query(
                collection(db, "products"), 
                where("__name__", "!=", product.id),
                limit(4)
            );
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const fallbackRelated = fallbackSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Product));
            setRelatedProducts(fallbackRelated);
        } finally {
            setLoadingRelated(false);
        }
    };
    fetchRelated();
  }, [product]);

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
    
    // Trigger Facebook Pixel event
    if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID !== '0000000000000') {
      import('react-facebook-pixel')
        .then(x => x.default)
        .then(ReactPixel => {
          ReactPixel.track('AddToCart', {
            content_ids: [product.id],
            content_name: product.name,
            content_type: 'product',
            value: product.price,
            currency: 'XOF', // Assuming currency is CFA
          });
        });
    }
  };
  
   const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(url, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Découvrez ${product.name} sur LE QG DE LA SAPE !`;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = `Salut ! J'ai trouvé cet article qui pourrait te plaire : ${product.name}. Jette un oeil ici : ${productUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
                    
                    <Separator className="my-8" />

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold">Partager :</span>
                        <div className="flex gap-2">
                             <Button variant="outline" size="icon" onClick={shareOnFacebook} aria-label="Partager sur Facebook">
                                <Facebook className="h-5 w-5" />
                            </Button>
                             <Button variant="outline" size="icon" onClick={shareOnTwitter} aria-label="Partager sur Twitter">
                                <Twitter className="h-5 w-5" />
                            </Button>
                             <Button variant="outline" size="icon" onClick={shareOnWhatsApp} aria-label="Partager sur WhatsApp">
                                <WhatsAppIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
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
