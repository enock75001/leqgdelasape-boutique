
'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { ShoppingCart, Twitter, Facebook, Star } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { Product, Variant, Review } from '@/lib/mock-data';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, limit, query, where, addDoc, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { recommendSimilarProducts } from '@/ai/flows/recommend-similar-products-flow';
import { Separator } from '../ui/separator';
import { useAuth } from '@/context/auth-context';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './star-rating';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface ProductDetailClientProps {
    product: Product;
}

// SVG for WhatsApp, as it's not in lucide-react
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
)

export function ProductDetailClient({ product: initialProduct }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [productUrl, setProductUrl] = useState('');
  
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const discountPercentage = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

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
    
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const reviewsQuery = query(
          collection(db, `products/${product.id}/reviews`),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(reviewsQuery);
        const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchRelated();
    fetchReviews();

  }, [product.id, product.name, product.description, product.variants]);

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
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Vous devez être connecté", description: "Veuillez vous connecter pour laisser un avis.", variant: "destructive" });
        return;
    }
    if (newRating === 0) {
        toast({ title: "Note requise", description: "Veuillez sélectionner une note en étoiles.", variant: "destructive" });
        return;
    }
    if (!newComment.trim()) {
        toast({ title: "Commentaire requis", description: "Veuillez écrire quelques mots sur le produit.", variant: "destructive" });
        return;
    }

    setIsSubmittingReview(true);
    const reviewData = {
        userId: user.uid,
        userName: user.name || 'Anonyme',
        userAvatar: user.avatarUrl || '',
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp(),
    };

    try {
        const productRef = doc(db, 'products', product.id);
        const reviewRef = collection(db, `products/${product.id}/reviews`);
        
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Le produit n'existe pas !");
            }
            
            const currentData = productDoc.data();
            const currentReviewCount = currentData.reviewCount || 0;
            const currentAverageRating = currentData.averageRating || 0;
            
            const newReviewCount = currentReviewCount + 1;
            const newAverageRating = ((currentAverageRating * currentReviewCount) + newRating) / newReviewCount;
            
            transaction.update(productRef, {
                reviewCount: newReviewCount,
                averageRating: newAverageRating
            });
            
            transaction.set(doc(reviewRef), reviewData);
        });

        // Optimistically update UI
        setReviews(prev => [{...reviewData, id: 'temp-id', createdAt: new Date()}, ...prev]);
        setProduct(prev => ({...prev, reviewCount: (prev.reviewCount || 0) + 1, averageRating: (( (prev.averageRating || 0) * (prev.reviewCount || 0)) + newRating) / ((prev.reviewCount || 0) + 1) }));
        setNewRating(0);
        setNewComment('');

        toast({ title: "Avis soumis", description: "Merci pour votre contribution !" });
    } catch (error) {
        console.error("Erreur lors de la soumission de l'avis:", error);
        toast({ title: "Erreur", description: "Impossible de soumettre l'avis.", variant: "destructive" });
    } finally {
        setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-transparent">
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                <div>
                   <Carousel className="w-full relative">
                      {product.isNew && (
                          <Badge className="absolute top-4 left-4 z-10">Nouveau</Badge>
                      )}
                      {discountPercentage && (
                          <Badge variant="destructive" className="absolute top-4 right-4 z-10">-{discountPercentage}%</Badge>
                      )}
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
                    
                    <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={product.averageRating || 0} />
                        <span className="text-sm text-muted-foreground">({product.reviewCount || 0} avis)</span>
                    </div>
                    
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

            <Separator className="my-16" />

            {/* Reviews Section */}
            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                    <h2 className="text-2xl font-headline font-bold mb-4">Avis des Clients</h2>
                    <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
                        <div className="text-5xl font-bold text-primary">{product.averageRating?.toFixed(1) || 'N/A'}</div>
                        <div>
                            <StarRating rating={product.averageRating || 0} size={24} />
                            <p className="text-sm text-muted-foreground mt-1">Basé sur {product.reviewCount || 0} avis</p>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-8">
                    {/* Review Form */}
                    <div>
                        <h3 className="text-xl font-headline font-semibold mb-4">Laissez votre avis</h3>
                        {user ? (
                            <form onSubmit={handleReviewSubmit} className="space-y-4">
                                <div>
                                    <Label>Votre note</Label>
                                    <div className="flex items-center gap-1 mt-1">
                                        <StarRating rating={newRating} onRatingChange={setNewRating} interactive size={28}/>
                                    </div>
                                </div>
                                <Textarea 
                                    placeholder="Partagez votre expérience avec ce produit..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    rows={4}
                                    required
                                />
                                <Button type="submit" disabled={isSubmittingReview}>
                                    {isSubmittingReview && <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full" />}
                                    Soumettre l'avis
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center bg-muted/50 p-6 rounded-lg">
                                <p className="mb-4">Vous devez être connecté pour laisser un avis.</p>
                                <Button asChild>
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {/* Reviews List */}
                    <div className="space-y-6">
                        {loadingReviews ? (
                            <p>Chargement des avis...</p>
                        ) : reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.userAvatar} />
                                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.userName}</p>
                                            <span className="text-xs text-muted-foreground">
                                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <StarRating rating={review.rating} className="my-1" />
                                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">Aucun avis pour ce produit pour le moment. Soyez le premier !</p>
                        )}
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
