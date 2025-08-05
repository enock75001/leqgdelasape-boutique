
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/mock-data';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from "embla-carousel-autoplay";


const categories = ["T-shirts", "Jeans", "Dresses", "Jackets", "Accessories"];

const promotions = [
  {
    title: "Collection Automne-Hiver",
    description: "Découvrez nos nouvelles pièces chaudes et élégantes pour la saison.",
    image: "https://placehold.co/1200x600.png",
    hint: "autumn fashion",
    link: "#collection"
  },
  {
    title: "Offre Spéciale T-shirts",
    description: "Le deuxième T-shirt à -50% avec le code PROMO50.",
    image: "https://placehold.co/1200x600.png",
    hint: "t-shirt style",
    link: "#collection"
  },
  {
    title: "Livraison Gratuite",
    description: "Profitez de la livraison gratuite pour toute commande supérieure à 75€.",
    image: "https://placehold.co/1200x600.png",
    hint: "delivery package",
    link: "/cart"
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sortOption, setSortOption] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const q = query(collection(db, "products"), orderBy("name")); // Basic query
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(fetchedProducts);
      
      const maxPrice = fetchedProducts.reduce((max, p) => p.price > max ? p.price : max, 0);
      const initialMaxPrice = Math.ceil((maxPrice || 50000) / 1000) * 1000;
      setPriceRange([0, initialMaxPrice]);
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(product => {
        const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
        const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
        return categoryMatch && priceMatch;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'newest':
            // Assuming no date field, sort by name as a proxy
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [products, sortOption, selectedCategory, priceRange]);

  const ProductSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
        </div>
    </div>
  );

  return (
    <div className="bg-background/80 backdrop-blur-sm">

       {/* Hero Carousel Section */}
        <section className="w-full relative">
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
        </section>


      <div className="container mx-auto px-4 py-8 sm:py-16">
         <div id="collection" className="pt-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-headline">Notre Collection</h2>
                <p className="text-lg text-muted-foreground mt-2">Trouvez votre style unique parmi nos pièces sélectionnées.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-x-12">
                {/* Filters Sidebar */}
                <aside className="hidden md:block md:col-span-1 sticky top-24 h-fit bg-card/80 backdrop-blur-sm p-6 rounded-lg">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-headline font-semibold">Catégories</h3>
                            <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="cat-all" />
                                    <Label htmlFor="cat-all">Toutes</Label>
                                </div>
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center space-x-2">
                                        <RadioGroupItem value={cat} id={`cat-${cat}`} />
                                        <Label htmlFor={`cat-${cat}`}>{cat}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-xl font-headline font-semibold">Prix</h3>
                            <Slider
                                defaultValue={[priceRange[1]]}
                                max={50000}
                                step={1000}
                                onValueChange={(value) => setPriceRange([0, value[0]])}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>0 FCFA</span>
                                <span>{priceRange[1].toLocaleString()} FCFA</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
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

    