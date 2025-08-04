import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shirt, Camera, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/mock-data';
import { ProductCard } from '@/components/products/product-card';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getFeaturedProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), limit(4));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
}


export default async function Home() {
  const products = await getFeaturedProducts();
  
  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <Image
          src="https://placehold.co/1800x1200.png"
          alt="Fashion models"
          data-ai-hint="elegant fashion models"
          layout="fill"
          objectFit="cover"
          className="bg-primary"
        />
        <div className="relative z-20 container mx-auto px-4 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-4 drop-shadow-lg">LE BLEU</h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-8 drop-shadow-md">L'Élégance Redéfinie.</p>
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
            <Link href="/products">Découvrir la collection</Link>
          </Button>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline">Rejoignez Notre Communauté</h2>
            <p className="text-lg text-muted-foreground mt-2">Connectez-vous, partagez et laissez-vous inspirer par d'autres passionnés de mode.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="hover:shadow-lg transition-shadow duration-300">
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
            <Card className="hover:shadow-lg transition-shadow duration-300">
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
            <Card className="hover:shadow-lg transition-shadow duration-300">
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
      
      <section className="py-16 md:py-24 bg-secondary">
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
          <div className="text-center mt-12">
            <Button asChild>
                <Link href="/products">Voir tous les produits</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
