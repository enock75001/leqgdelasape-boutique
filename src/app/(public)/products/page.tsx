import { ProductCard } from '@/components/products/product-card';
import { db } from '@/lib/firebase';
import { Product } from '@/lib/mock-data';
import { collection, getDocs } from 'firebase/firestore';

async function getProducts(): Promise<Product[]> {
  const querySnapshot = await getDocs(collection(db, "products"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-headline font-bold text-foreground">Notre Collection</h1>
          <p className="text-xl text-muted-foreground mt-2">Des pièces uniques pour un style qui vous ressemble.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
