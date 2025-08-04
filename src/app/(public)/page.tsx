import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shirt, Camera, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/mock-data';
import { ProductCard } from '@/components/products/product-card';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), limit(4));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}

const categoryGrid = [
    { name: "Nouveautés", href: "/products", image: "https://placehold.co/600x800.png", hint: "modern fashion", className: "lg:col-span-2 lg:row-span-2" },
    { name: "Hauts", href: "/products?category=T-shirts", image: "https://placehold.co/600x400.png", hint: "stylish t-shirt" },
    { name: "Pantalons", href: "/products?category=Jeans", image: "https://placehold.co/600x400.png", hint: "designer jeans" },
    { name: "Accessoires", href: "/products?category=Accessories", image: "https://placehold.co/600x400.png", hint: "fashion accessory" },
    { name: "Vestes", href: "/products?category=Jackets", image: "https://placehold.co/600x400.png", hint: "cool jacket" },
];

export default async function Home() {
  const products = await getFeaturedProducts();
  
  return (
    <div className="flex flex-col">
      <section className="bg-background">
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4">LE QG DE LA SAPE</h1>
                <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">La destination ultime pour le prêt-à-porter qui définit votre style.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[20rem]">
                 {categoryGrid.map((item, index) => (
                    <Link key={index} href={item.href} className={cn("group relative flex items-end justify-center rounded-lg overflow-hidden", item.className)}>
                        <Image
                            src={item.image}
                            alt={item.name}
                            data-ai-hint={item.hint}
                            layout="fill"
                            objectFit="cover"
                            className="bg-primary/20 group-hover:scale-105 transition-transform duration-300 ease-in-out"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <h2 className="relative text-3xl font-headline text-white mb-4 z-10">{item.name}</h2>
                    </Link>
                ))}
            </div>
             <div className="text-center mt-12">
                <Button asChild size="lg">
                    <Link href="/products">Découvrir toute la collection</Link>
                </Button>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline">Produits Vedettes</h2>
            <p className="text-lg text-muted-foreground mt-2">Notre dernière collection, conçue pour le créateur de tendances moderne.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
       <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline">Rejoignez Notre Communauté</h2>
            <p className="text-lg text-muted-foreground mt-2">Connectez-vous, partagez et laissez-vous inspirer par d'autres passionnés de mode.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-transparent shadow-none">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Partagez Vos Tenues</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Postez vos looks préférés et inspirez les autres dans notre fil communautaire.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-transparent shadow-none">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Connectez-vous avec des Stylistes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Interagissez avec un réseau de personnes passionnées par la mode et le style.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-transparent shadow-none">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Shirt className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Découvrez les Tendances</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Obtenez des conseils, des guides de style et de la motivation pour construire votre garde-robe parfaite.</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="outline">
                <Link href="/community">Visiter le fil</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
