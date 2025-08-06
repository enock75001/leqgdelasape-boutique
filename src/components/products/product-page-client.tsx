
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Product, Promotion, Category } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay";
import { useSearch } from '@/context/search-context';

interface ProductPageClientProps {
    initialPromotions: Promotion[];
    initialCategories: Category[];
    initialProducts: Product[];
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array]; // Create a copy

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}


export function ProductPageClient({ initialPromotions, initialCategories, initialProducts }: ProductPageClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sortOption, setSortOption] = useState('shuffled');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [formattedMaxPrice, setFormattedMaxPrice] = useState<string | null>(null);
  
  const { searchTerm, setSearchResults } = useSearch();

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    // Shuffle products on initial client render
    const shuffledProducts = shuffleArray(initialProducts);
    setProducts(shuffledProducts);

    const maxProductPrice = initialProducts.reduce((max, p) => p.price > max ? p.price : max, 0);
    const initialMaxPrice = Math.ceil((maxProductPrice || 50000) / 1000) * 1000;
    setMaxPrice(initialMaxPrice);
    setPriceRange([0, initialMaxPrice]);

    setIsLoading(false);
  }, [initialProducts]);


  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
        const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
        const searchMatch = searchTerm.trim() === '' || 
                            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        return priceMatch && searchMatch;
      });

    switch (sortOption) {
        case 'price_asc':
            return filtered.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return filtered.sort((a, b) => b.price - a.price);
        case 'newest':
            // Assuming no date field, sort by name as a proxy for now
            return filtered.sort((a, b) => b.name.localeCompare(a.name));
        case 'shuffled':
        default:
             return filtered; // Already shuffled on fetch
    }
  }, [products, sortOption, priceRange, searchTerm]);

  useEffect(() => {
    // This effect updates the search suggestions dropdown.
    if (searchTerm.trim() !== '') {
      setSearchResults(filteredAndSortedProducts.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filteredAndSortedProducts, setSearchResults]);

  useEffect(() => {
    // This useEffect runs only on the client, after hydration
    setFormattedMaxPrice(priceRange[1].toLocaleString());
  }, [priceRange]);


  const ProductSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
        </div>
    </div>
  );
  
  const showCarousel = !searchTerm || searchTerm.trim() === '';

  return (
    <div className="bg-transparent">
       {/* Hero Carousel Section */}
       {showCarousel && (
        <section className="w-full relative">
          {promotions.length === 0 ? <Skeleton className="h-[60vh] min-h-[400px] w-full" /> : (
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {promotions.map((promo, index) => (
                        <CarouselItem key={index}>
                            <div className="relative h-[60vh] min-h-[400px] w-full">
                                <Image
                                    src={promo.image}
                                    alt={promo.title}
                                    data-ai-hint={promo.hint}
                                    layout="fill"
                                    objectFit="cover"
                                    className="brightness-50"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                                    <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-wider uppercase">{promo.title}</h1>
                                    <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto">{promo.description}</p>
                                    <Button size="lg" asChild className="font-headline tracking-widest text-lg mt-8">
                                        <Link href={promo.link}>Découvrir</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 border-none" />
            </Carousel>
          )}
        </section>
      )}


      <div className="container mx-auto px-4 py-8 sm:py-16">
         <div id="collection" className="pt-8 scroll-mt-20">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">
                    {searchTerm ? `Résultats pour "${searchTerm}"` : 'Notre Collection'}
                </h2>
                 {!searchTerm && <p className="text-lg text-muted-foreground mt-2">Trouvez votre style unique parmi nos pièces sélectionnées.</p>}
            </div>
            <div className="grid md:grid-cols-4 gap-x-12">
                {/* Filters Sidebar */}
                <aside className="hidden md:block md:col-span-1 sticky top-24 h-fit bg-card/80 p-6 rounded-lg border">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-headline font-semibold">Catégories</h3>
                             <div className="space-y-2 flex flex-col">
                                <Link href="/" className="hover:text-primary transition-colors">Toutes</Link>
                                {categories.map(cat => (
                                    <Link key={cat.id} href={`/category/${encodeURIComponent(cat.name.toLowerCase())}`} className="hover:text-primary transition-colors">
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-lg font-headline font-semibold">Prix</h3>
                            <Slider
                                value={[priceRange[1]]}
                                max={maxPrice}
                                step={1000}
                                onValueChange={(value) => setPriceRange([0, value[0]])}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>0 FCFA</span>
                                <span>{formattedMaxPrice ? `${formattedMaxPrice} FCFA` : '...'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Products Grid */}
                <main className="md:col-span-3 mt-8 md:mt-0">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-muted-foreground">
                            {isLoading ? 'Chargement...' : `${filteredAndSortedProducts.length} résultat(s)`}
                        </p>
                        <Select value={sortOption} onValueChange={setSortOption} disabled={isLoading}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Trier par" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shuffled">Recommandé</SelectItem>
                                <SelectItem value="newest">Nouveautés</SelectItem>
                                <SelectItem value="price_asc">Prix : Croissant</SelectItem>
                                <SelectItem value="price_desc">Prix : Décroissant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
                        </div>
                    ) : filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                            {filteredAndSortedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-2xl font-semibold mb-2">Aucun Résultat</h3>
                            <p className="text-muted-foreground">
                                Aucun produit ne correspond à votre sélection. Essayez de modifier vos filtres.
                            </p>
                        </div>
                    )}
                </main>
            </div>
         </div>
      </div>
    </div>
  );
}
