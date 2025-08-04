
'use client';

import { useState, useEffect, useMemo } from 'react';
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

const categories = ["T-shirts", "Jeans", "Dresses", "Jackets", "Accessories"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sortOption, setSortOption] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);

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
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">Découvrez l'Élégance Masculine</h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2 max-w-2xl mx-auto">Votre style, votre signature. Le QG de la Sape vous offre le meilleur de la mode pour homme.</p>
          <div className="mt-4">
            <p className="text-md md:text-lg font-semibold text-primary">PROMOTION : 20% de réduction avec le code STYLE20</p>
          </div>
          <div className="mt-6">
            <Button size="lg" asChild>
                <Link href="#collection">Explorer la collection</Link>
            </Button>
          </div>
        </div>
        
        <div id="collection" className="grid md:grid-cols-4 gap-x-12 pt-12">
            {/* Filters Sidebar */}
            <aside className="hidden md:block md:col-span-1 sticky top-24 h-fit">
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
  );
}
