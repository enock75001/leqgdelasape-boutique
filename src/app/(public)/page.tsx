
import { Suspense } from 'react';
import { db } from '@/lib/firebase';
import { Product, Promotion, Category } from '@/lib/mock-data';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ProductPageClient } from '@/components/products/product-page-client';
import { SearchProvider, useSearch } from '@/context/search-context';
import { SearchInitializer } from '@/components/layout/header';

// This is a server component. It fetches data and passes it to the client component.
export const dynamic = 'force-dynamic';

async function getPageData() {
    try {
        const promoQuery = query(collection(db, "promotions"), where("enabled", "==", true));
        const catQuery = query(collection(db, "categories"), orderBy("name"));
        const productQuery = query(collection(db, "products"));

        const [promoSnapshot, catSnapshot, productSnapshot] = await Promise.all([
            getDocs(promoQuery),
            getDocs(catQuery),
            getDocs(productQuery)
        ]);

        const promotions = promoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
        const categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const allProducts = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        // Identify hidden categories
        const hiddenCategoryNames = new Set(
            categories.filter(cat => !(cat.isVisible ?? true)).map(cat => cat.name)
        );

        // Filter products: hide a product only if ALL of its categories are hidden
        const products = allProducts.filter(product => {
            if (!product.categories || product.categories.length === 0) {
                return true; // Products with no categories are always visible
            }
            // A product should be hidden if every category it belongs to is in the hidden set.
            const isHidden = product.categories.every(catName => hiddenCategoryNames.has(catName));
            return !isHidden;
        });
        
        return { promotions, categories, products };
    } catch (error) {
        console.error("Failed to fetch initial page data:", error);
        return { promotions: [], categories: [], products: [] };
    }
}


export default async function ProductsPage() {
    const { promotions, categories, products } = await getPageData();
    
    return (
        <Suspense>
             <SearchInitializer />
             <ProductPageClient 
                initialPromotions={promotions}
                initialCategories={categories}
                initialProducts={products}
            />
        </Suspense>
    );
}
