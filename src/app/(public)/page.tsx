
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Eye, Medal, Sparkles } from 'lucide-react';
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
    { name: "La Collection", href: "/products", image: "https://placehold.co/800x1200.png", hint: "urban fashion", className: "lg:col-span-2 lg:row-span-2" },
    { name: "Hauts", href: "/products?category=T-shirts", image: "https://placehold.co/800x600.png", hint: "stylish hoodie" },
    { name: "Bas", href: "/products?category=Jeans", image: "https://placehold.co/800x600.png", hint: "designer pants" },
];

export default async function Home() {
  const products = await getFeaturedProducts();
  
  return (
    <div className="flex flex-col text-foreground">
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Hero background"
            data-ai-hint="dark fashion editorial"
            fill
            objectFit="cover"
            className="opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="container relative z-10 px-4">
            <h1 className="text-5xl md:text-8xl font-headline font-bold mb-4 drop-shadow-lg">LE QG DE LA SAPE</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-primary-foreground/80 mb-8">Votre style, notre mission. Le prêt-à-porter qui fait la différence.</p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/products">Découvrir la collection <ArrowRight className="ml-2" /></Link>
            </Button>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {categoryGrid.map((item, index) => (
                <Link key={index} href={item.href} className={cn("group relative flex items-end justify-start rounded-lg overflow-hidden p-8 min-h-[400px]", item.className)}>
                    <Image
                        src={item.image}
                        alt={item.name}
                        data-ai-hint={item.hint}
                        layout="fill"
                        objectFit="cover"
                        className="absolute inset-0 z-0 bg-primary/20 group-hover:scale-105 transition-transform duration-300 ease-in-out"
                    />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="relative z-10">
                      <h2 className="text-4xl font-headline text-white">{item.name}</h2>
                      <div className="flex items-center text-primary mt-2 group-hover:underline">
                        <span>Voir plus</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline text-card-foreground">Sélection de la semaine</h2>
            <p className="text-lg text-muted-foreground mt-2">Les pièces incontournables, choisies pour vous.</p>
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
            <h2 className="text-4xl font-headline">Pourquoi Nous ?</h2>
            <p className="text-lg text-muted-foreground mt-2">L'excellence au service de votre style.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="bg-card border-border/50 hover:border-primary transition-colors duration-300">
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit">
                  <Medal className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Qualité Supérieure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Des matériaux sélectionnés avec soin pour un confort et une durabilité exceptionnels.</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50 hover:border-primary transition-colors duration-300">
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Designs Exclusifs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Des collections uniques que vous ne trouverez nulle part ailleurs. Affirmez votre différence.</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50 hover:border-primary transition-colors duration-300">
              <CardHeader className="items-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit">
                  <Eye className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="font-headline pt-4">Le Sens du Détail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Chaque couture, chaque bouton est pensé pour parfaire votre look. Rien n'est laissé au hasard.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  );
}
