
import Link from 'next/link';
import { Phone, MapPin, Twitter, Facebook, Instagram } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';

export function SiteFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand and Info */}
            <div className="flex flex-col gap-4 items-center md:items-start">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE Logo" width={40} height={40} className="rounded-full object-cover" />
                    <span className="font-headline text-lg font-bold tracking-wide">LE QG DE LA SAPE</span>
                </Link>
                <p className="text-sm text-muted-foreground text-center md:text-left">
                    L'élégance a son quartier général. Vêtements et accessoires de mode pour un style unique.
                </p>
            </div>
            {/* Column 2: Quick Links */}
            <div>
                 <h3 className="font-headline font-semibold mb-4 text-center md:text-left">Navigation</h3>
                 <ul className="space-y-2 text-sm text-center md:text-left">
                     <li><Link href="/#collection" className="text-muted-foreground hover:text-primary transition-colors">Collection</Link></li>
                     <li><Link href="/account/orders" className="text-muted-foreground hover:text-primary transition-colors">Suivre ma commande</Link></li>
                     <li><Link href="/account" className="text-muted-foreground hover:text-primary transition-colors">Mon Compte</Link></li>
                 </ul>
            </div>
             {/* Column 3: Help & Policies */}
            <div>
                 <h3 className="font-headline font-semibold mb-4 text-center md:text-left">Aide & Informations</h3>
                 <ul className="space-y-2 text-sm text-center md:text-left">
                     <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">À propos de nous</Link></li>
                     <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Politique de livraison</Link></li>
                     <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Politique de retour</Link></li>
                     <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                 </ul>
            </div>
             {/* Column 4: Contact & Social */}
             <div>
                <h3 className="font-headline font-semibold mb-4 text-center md:text-left">Contactez-nous</h3>
                <ul className="space-y-3 text-sm text-center md:text-left">
                    <li className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                        <Phone className="h-4 w-4" />
                        <span>+225 01 02 03 04 05</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                        <MapPin className="h-4 w-4" />
                        <span>Abidjan, Angré, 8ème tranche</span>
                    </li>
                </ul>
                <div className="flex gap-2 mt-4 justify-center md:justify-start">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Twitter className="h-5 w-5"/></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Facebook className="h-5 w-5"/></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Instagram className="h-5 w-5"/></Link>
                    </Button>
                </div>
            </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
             <p>© {new Date().getFullYear()} LE QG DE LA SAPE. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
