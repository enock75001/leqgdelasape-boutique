
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Product, Promotion, Category } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay";
import { useSearch } from '@/context/search-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Download, Smartphone, Share, PlusSquare } from 'lucide-react';
import { usePwa } from '@/context/pwa-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface ProductPageClientProps {
    initialPromotions: Promotion[];
    initialCategories: Category[];
    initialProducts: Product[];
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array]; // Create a copy

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
}

const buildCategoryTree = (categories: Category[]): Category[] => {
    const visibleCategories = categories.filter(c => c.isVisible ?? true);
    const categoryMap = new Map<string, Category & { subcategories: Category[] }>();
    const rootCategories: (Category & { subcategories: Category[] })[] = [];

    visibleCategories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    visibleCategories.forEach(cat => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId)!;
            if(!parent.subcategories) parent.subcategories = [];
            parent.subcategories.push(categoryMap.get(cat.id)!);
        } else {
            rootCategories.push(categoryMap.get(cat.id)!);
        }
    });

    return rootCategories;
};

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.39,14.76c-1.22-1.3-2.65-2.07-4.43-2.07s-3.34.8-4.47,2.12c-1.36,1.6-2.31,3.89-2.2,5.91,0,.08.06.13.14.12s9.29-3.07,9.32-3.07a.1.1,0,0,0,0-.19ZM15,4.32c0-1.21.9-2.11,2.06-2.19S19.18,3,19.2,4.19c0,.1-.07.16-.16.16-1.1.07-2.94.8-2.94,2.3,0,1.55,2,2.3,2.94,2.23a.15.15,0,0,1,.16.16c-.06,1.25-1,2.23-2.1,2.23s-2.06-1-2.06-2.23a.15.15,0,0,1,.15-.16c.88,0,2.06-.65,2.06-2.11,0-1.11-1.1-2.07-2.22-2.19A.14.14,0,0,1,15,4.32Z"/>
    </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 125" fill="currentColor" {...props}>
    <path d="M83,38.3A20.3,20.3,0,0,0,62.8,18.1H37.2A20.3,20.3,0,0,0,17,38.3V61.7H83ZM32.1,27.5a4.2,4.2,0,1,1,4.2-4.2A4.2,4.2,0,0,1,32.1,27.5Zm35.8,0a4.2,4.2,0,1,1,4.2-4.2A4.2,4.2,0,0,1,67.9,27.5Z"/>
    <path d="M17,66.7H29.5l4.5,12.1a2.8,2.8,0,0,0,5.3-1.9V66.7H56.2v10a2.8,2.8,0,0,0,5.3,1.9l4.5-12.1H83V81.9A20.3,20.3,0,0,0,62.8,102.1H37.2A20.3,20.3,0,0,0,17,81.9Z" style={{opacity: 0.4}}/>
  </svg>
);

const PwaInstallBanner = () => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (!isInstallable && !isApple) return null;

    return (
        <section className="bg-primary/10 border-t border-b border-primary/20 py-8">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-6">
                <Smartphone className="h-12 w-12 text-primary flex-shrink-0" />
                <div className="flex-grow">
                    <h2 className="text-2xl font-headline font-bold">Une meilleure expérience vous attend</h2>
                    <p className="text-muted-foreground mt-1">Installez notre application sur votre appareil pour un accès plus rapide et des notifications exclusives.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-4 mt-4 md:mt-0">
                    {isApple && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="gap-2">
                                    <AppleIcon className="h-5 w-5" /> Installer pour iPhone
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Installer l'application sur iOS</DialogTitle>
                                    <DialogDescription>
                                        Pour installer l'application sur votre iPhone ou iPad, suivez ces étapes simples :
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 text-sm">
                                    <p>1. Appuyez sur le bouton de Partage dans la barre d'outils de Safari.</p>
                                    <div className="flex justify-center"><Share className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                                    <p>2. Faites défiler vers le bas et sélectionnez "Ajouter à l'écran d'accueil".</p>
                                    <div className="flex justify-center"><PlusSquare className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                                    <p>3. Appuyez sur "Ajouter" pour confirmer.</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    {isInstallable && (
                        <Button size="lg" onClick={promptInstall} className="gap-2">
                            <AndroidIcon className="h-5 w-5" /> Installer pour Android
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
};


export function ProductPageClient({ initialPromotions, initialCategories, initialProducts }: ProductPageClientProps) {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sortOption, setSortOption] = useState('shuffled');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [formattedMaxPrice, setFormattedMaxPrice] = useState<string | null>(null);
  
  const { searchTerm, setSearchResults, performSearch } = useSearch();

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    const shuffledProducts = shuffleArray(initialProducts);
    setDisplayedProducts(shuffledProducts);
    setCategoryTree(buildCategoryTree(initialCategories));

    const maxProductPrice = initialProducts.reduce((max, p) => p.price > max ? p.price : max, 0);
    const initialMaxPrice = Math.ceil((maxProductPrice || 50000) / 1000) * 1000;
    setMaxPrice(initialMaxPrice);
    setPriceRange([0, initialMaxPrice]);

    setIsLoading(false);
  }, [initialProducts, initialCategories]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim() === '') {
        setDisplayedProducts(shuffleArray(initialProducts));
        return;
    }
    setIsLoading(true);
    const results = await performSearch(query, initialProducts);
    setDisplayedProducts(results);
    setIsLoading(false);
  }, [initialProducts, performSearch]);

  useEffect(() => {
      handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);


  const filteredAndSortedProducts = useMemo(() => {
    let filtered = displayedProducts.filter(product => {
        return product.price >= priceRange[0] && product.price <= priceRange[1];
      });

    switch (sortOption) {
        case 'price_asc':
            return filtered.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return filtered.sort((a, b) => b.price - a.price);
        case 'newest':
            return filtered.sort((a, b) => b.name.localeCompare(a.name));
        case 'shuffled':
        default:
             return filtered;
    }
  }, [displayedProducts, sortOption, priceRange, searchTerm]);

  useEffect(() => {
    if (searchTerm.trim() !== '') {
      setSearchResults(filteredAndSortedProducts.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filteredAndSortedProducts, setSearchResults]);

  useEffect(() => {
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

      {showCarousel && <PwaInstallBanner />}

      <div className="container mx-auto px-4 py-8 sm:py-16">
         <div id="collection" className="pt-8 scroll-mt-20">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">
                    {searchTerm ? `Résultats pour "${searchTerm}"` : 'Notre Collection'}
                </h2>
                 {!searchTerm && <p className="text-lg text-muted-foreground mt-2">Trouvez votre style unique parmi nos pièces sélectionnées.</p>}
            </div>
            <div className="grid md:grid-cols-4 gap-x-12">
                <aside className="hidden md:block md:col-span-1 sticky top-24 h-fit bg-card/80 p-6 rounded-lg border">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-headline font-semibold">Catégories</h3>
                             <div className="space-y-2 flex flex-col">
                                <Link href="/" className="font-medium text-primary hover:underline">Toutes les catégories</Link>
                                <Accordion type="multiple" className="w-full">
                                    {categoryTree.map(cat => (
                                        <AccordionItem value={cat.id} key={cat.id} className="border-b-0">
                                            <AccordionTrigger className="py-2 hover:no-underline justify-start gap-2 [&[data-state=open]>svg]:hidden">
                                                <Link href={`/category/${encodeURIComponent(cat.name.toLowerCase())}`} className="hover:underline flex-1 text-left">{cat.name}</Link>
                                                {cat.subcategories && cat.subcategories.length > 0 && <span className="text-sm text-muted-foreground">({cat.subcategories.length})</span>}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="pl-4 border-l ml-2 flex flex-col gap-1">
                                                    {cat.subcategories?.map(subCat => (
                                                        <Link key={subCat.id} href={`/category/${encodeURIComponent(subCat.name.toLowerCase())}`} className="hover:text-primary transition-colors text-muted-foreground hover:underline">
                                                            {subCat.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
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
