
'use client';

import { db } from '@/lib/firebase';
import { Product, Category } from '@/lib/mock-data';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ProductCard } from '@/components/products/product-card';
import { notFound, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const buildCategoryTree = (categories: Category[], currentCategoryId: string | null): Category[] => {
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


export default function CategoryPageClient() {
    const params = useParams();
    const slug = params.slug as string;

    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [categoryTree, setCategoryTree] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [sortOption, setSortOption] = useState('shuffled');
    const [priceRange, setPriceRange] = useState([0, 50000]);
    const [maxPrice, setMaxPrice] = useState(50000);
    const [formattedMaxPrice, setFormattedMaxPrice] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategoryData = async () => {
            setIsLoading(true);
            const decodedSlug = decodeURIComponent(slug);

            try {
                const catQuery = query(collection(db, "categories"));
                const catSnapshot = await getDocs(catQuery);
                const allCats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
                setAllCategories(allCats);

                const currentCategory = allCats.find(c => c.name.toLowerCase() === decodedSlug);
                
                if (!currentCategory || !(currentCategory.isVisible ?? true)) {
                    setCategory(null);
                    setProducts([]);
                } else {
                    setCategory(currentCategory);
                    setCategoryTree(buildCategoryTree(allCats, currentCategory.id));
                    
                    const productQuery = query(collection(db, "products"), where("categories", "array-contains", currentCategory.name));
                    const productSnapshot = await getDocs(productQuery);
                    const categoryProducts = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    setProducts(categoryProducts);

                    const maxProductPrice = categoryProducts.reduce((max, p) => p.price > max ? p.price : max, 0);
                    const initialMaxPrice = Math.ceil((maxProductPrice || 50000) / 1000) * 1000;
                    setMaxPrice(initialMaxPrice);
                    setPriceRange([0, initialMaxPrice]);
                }
            } catch (error) {
                console.error("Error fetching category data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchCategoryData();
        }
    }, [slug]);

    useEffect(() => {
        setFormattedMaxPrice(priceRange[1].toLocaleString());
    }, [priceRange]);
    
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(product => {
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
    }, [products, sortOption, priceRange]);
    
    if (isLoading) {
         return (
            <div className="container mx-auto px-4 py-16">
                <Skeleton className="h-10 w-1/2 mx-auto mb-12" />
                <div className="grid md:grid-cols-4 gap-x-12">
                    <aside className="hidden md:block md:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </aside>
                    <main className="md:col-span-3">
                         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full"/>)}
                        </div>
                    </main>
                </div>
            </div>
         );
    }

    if (!category) {
        notFound();
    }
    
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-headline font-bold">{category.name}</h1>
                <p className="text-lg text-muted-foreground mt-2">Découvrez notre sélection de {category.name.toLowerCase()}.</p>
            </div>
            
             <div className="grid md:grid-cols-4 gap-x-12">
                <aside className="hidden md:block md:col-span-1 sticky top-24 h-fit bg-card/80 p-6 rounded-lg border">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-headline font-semibold">Catégories</h3>
                             <div className="space-y-2 flex flex-col">
                                <Link href="/" className="font-medium text-primary hover:underline">Toutes les catégories</Link>
                                <Accordion type="multiple" className="w-full" defaultValue={allCategories.find(c => c.id === category?.id)?.parentId || category?.id}>
                                    {categoryTree.map(cat => (
                                        <AccordionItem value={cat.id} key={cat.id} className="border-b-0">
                                            <AccordionTrigger className="py-2 hover:no-underline justify-start gap-2 [&[data-state=open]>svg]:hidden">
                                                <Link href={`/category/${encodeURIComponent(cat.name.toLowerCase())}`} className={`hover:underline flex-1 text-left ${cat.id === category?.id ? 'text-primary font-bold' : ''}`}>{cat.name}</Link>
                                                {cat.subcategories && cat.subcategories.length > 0 && <span className="text-sm text-muted-foreground">({cat.subcategories.length})</span>}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="pl-4 border-l ml-2 flex flex-col gap-1">
                                                    {cat.subcategories?.map(subCat => (
                                                        <Link key={subCat.id} href={`/category/${encodeURIComponent(subCat.name.toLowerCase())}`} className={`hover:text-primary transition-colors text-muted-foreground hover:underline ${subCat.id === category?.id ? 'text-primary font-bold' : ''}`}>
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
                            {filteredAndSortedProducts.length} résultat(s)
                        </p>
                        <Select value={sortOption} onValueChange={setSortOption}>
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
                    {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8">
                            {filteredAndSortedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-2xl font-semibold mb-2">Bientôt Disponible</h3>
                            <p className="text-muted-foreground">
                                Aucun produit n'est actuellement disponible dans cette catégorie ou avec ces filtres.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
