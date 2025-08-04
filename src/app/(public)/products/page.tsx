
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
      setPriceRange([0, Math.ceil(maxPrice / 1000) * 1000]); // Set initial max price
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
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-headline font-bold text-foreground">Notre Collection</h1>
          <p className="text-xl text-muted-foreground mt-2">Des pièces uniques pour un style qui vous ressemble.</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="md:col-span-1">
                <div className="p-6 rounded-lg bg-card border border-border/50 sticky top-24">
                    <h3 className="text-xl font-headline font-semibold mb-6">Filtres</h3>
                    
                    {/* Category Filter */}
                    <div className="mb-8">
                        <h4 className="font-semibold mb-4">Catégories</h4>
                        <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
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

                    {/* Price Filter */}
                    <div>
                        <h4 className="font-semibold mb-4">Prix</h4>
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
            <main className="md:col-span-3">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-muted-foreground">
                        {filteredAndSortedProducts.length} résultat(s)
                    </p>
                    <Select value={sortOption} onValueChange={setSortOption}>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <>
                            <ProductSkeleton />
                            <ProductSkeleton />
                            <ProductSkeleton />
                            <ProductSkeleton />
                            <ProductSkeleton />
                            <ProductSkeleton />
                        </>
                    ) : (
                        filteredAndSortedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            </main>
        </div>
      </div>
    </div>
  );
}
