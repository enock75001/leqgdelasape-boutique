
import Link from 'next/link';
import { Phone, Store, MapPin } from 'lucide-react';
import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 text-center md:flex-row md:gap-4 md:px-0 md:text-left">
           <Link href="/" className="flex items-center gap-3">
             <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE Logo" width={40} height={40} className="rounded-full object-cover" />
             <span className="font-headline text-lg font-bold tracking-wide">LE QG DE LA SAPE</span>
          </Link>
          <p className="text-sm leading-loose text-muted-foreground hidden md:block">
            © {new Date().getFullYear()} LE QG DE LA SAPE. Tous droits réservés.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Service Client : +225 01 02 03 04 05</span>
            </div>
             <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Abidjan, Angré, 8ème tranche</span>
            </div>
        </div>
      </div>
    </footer>
  );
}
