import { Shirt, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2 mb-4 md:mb-0">
                <Link href="/" className="flex items-center gap-2 font-headline text-lg font-bold text-primary">
                    <Shirt className="h-6 w-6" />
                    <span>LE QG DE LA SAPE</span>
                </Link>
                <p className="text-sm text-muted-foreground mt-2">Votre style, notre mission.</p>
                <div className="flex items-center gap-2 mt-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Instagram className="h-5 w-5" />
                        </Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                            <Facebook className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Boutique</h4>
                <nav className="flex flex-col gap-1">
                    <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Collection</Link>
                    <Link href="/?category=T-shirts" className="text-muted-foreground hover:text-primary transition-colors">T-shirts</Link>
                    <Link href="/?category=Jeans" className="text-muted-foreground hover:text-primary transition-colors">Jeans</Link>
                    <Link href="/?category=Jackets" className="text-muted-foreground hover:text-primary transition-colors">Vestes</Link>
                </nav>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Compagnie</h4>
                <nav className="flex flex-col gap-1">
                    <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">À propos</Link>
                    <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                </nav>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Légal</h4>
                <nav className="flex flex-col gap-1">
                    <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Termes & Conditions</Link>
                    <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link>
                </nav>
            </div>
        </div>
         <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LE QG DE LA SAPE. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
