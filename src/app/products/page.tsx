import { ProductCard } from '@/components/products/product-card';
import { products } from '@/lib/mock-data';

export default function ProductsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-headline font-bold text-primary">Our Collection</h1>
          <p className="text-xl text-muted-foreground mt-2">Pure, refreshing, and delivered to your door.</p>
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
