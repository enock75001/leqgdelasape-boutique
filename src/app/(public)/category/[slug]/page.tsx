
import { db } from '@/lib/firebase';
import { Product, Category } from '@/lib/mock-data';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ProductCard } from '@/components/products/product-card';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface CategoryPageProps {
    params: {
        slug: string;
    }
}

async function getCategoryData(slug: string) {
    const decodedSlug = decodeURIComponent(slug);

    // Fetch the specific category to get its proper name
    const catQuery = query(collection(db, "categories"));
    const catSnapshot = await getDocs(catQuery);
    const allCategories = catSnapshot.docs.map(doc => doc.data() as Category);
    const currentCategory = allCategories.find(c => c.name.toLowerCase() === decodedSlug);
    
    if (!currentCategory) {
        return { category: null, products: [] };
    }

    // Fetch products for that category
    const productQuery = query(collection(db, "products"), where("category", "==", currentCategory.name));
    const productSnapshot = await getDocs(productQuery);
    const products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    return { category: currentCategory, products };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);
  const categoryName = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);

  return {
    title: `Catégorie: ${categoryName} | LE QG DE LA SAPE`,
    description: `Découvrez tous les produits de la catégorie ${categoryName} sur LE QG DE LA SAPE.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { category, products } = await getCategoryData(params.slug);

    if (!category) {
        notFound();
    }
    
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-headline font-bold">{category.name}</h1>
                <p className="text-lg text-muted-foreground mt-2">Découvrez notre sélection de {category.name.toLowerCase()}.</p>
            </div>
            
            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h3 className="text-2xl font-semibold mb-2">Bientôt Disponible</h3>
                    <p className="text-muted-foreground">
                        Aucun produit n'est actuellement disponible dans cette catégorie. Revenez bientôt !
                    </p>
                </div>
            )}
        </div>
    );
}

// This function tells Next.js which category pages to pre-build at build time.
export async function generateStaticParams() {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.map((doc) => doc.data());

    return categories.map((cat) => ({
        slug: encodeURIComponent(cat.name.toLowerCase()),
    }));
}
