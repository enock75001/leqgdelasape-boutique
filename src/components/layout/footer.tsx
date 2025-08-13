
'use client';

import Link from 'next/link';
import { Phone, MapPin, Twitter, Facebook, Instagram, PlusSquare, Share } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { SiteInfo } from '@/lib/mock-data';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { usePwa } from '@/context/pwa-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.5,13.62A3.48,3.48,0,0,0,18,10.2a3.3,3.3,0,0,0-3.46-3.72,4.3,4.3,0,0,0-3.29,1.74A4.33,4.33,0,0,0,8,6.48,3.34,3.34,0,0,0,4.5,10.2a3.49,3.49,0,0,0,1.5,3.14A4.55,4.55,0,0,0,6,20.28a2,2,0,0,0,2,1.22,1.87,1.87,0,0,0,1.88-1.2,3.34,3.34,0,0,1,2.24,0,1.88,1.88,0,0,0,1.88,1.2,2,2,0,0,0,2-1.22A4.55,4.55,0,0,0,16.5,13.62ZM12,4.09A2.11,2.11,0,0,1,14.11,6,2.08,2.08,0,0,1,12,7.91,2.09,2.09,0,0,1,9.89,6,2.08,2.08,0,0,1,12,4.09Z"/>
    </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M15.2,5.2H8.8a.78.78,0,0,0-.8.8V17.2a.78.78,0,0,0,.8.8h6.4a.78.78,0,0,0,.8-.8V6A.78.78,0,0,0,15.2,5.2Zm-3,12a1,1,0,1,1,1-1,1,1,0,0,1-1,1Zm3.4-3.6H8.4V7.6h6.4Z"/>
        <path d="M9.1,4.2,8.8,3.8a.76.76,0,0,0-1.1,0L7.4,4.2a.85.85,0,0,0,0,1.1L7.8,6,7.5,6.4a2,2,0,0,0,0,2.8l.3.4v4.8l-.3.4a2,2,0,0,0,0,2.8l.3.4L7.4,22a.85.85,0,0,0,0,1.1l.3.4a.76.76,0,0,0,1.1,0l.3-.4a.85.85,0,0,0,0-1.1L8.8,21l.4-.3V6l-.4-.3Z"/>
        <path d="M14.9,4.2l.3.4a.85.85,0,0,0,0-1.1L14.9,3.1l-.4.3L12,6h0l2.9,2.9.4.3a.85.85,0,0,0,1.1,0l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3Z"/>
        <path d="M14.9,23.8l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3,2.9-2.9V18l-2.5-2.5h0l-2.9-2.9V7.8l2.9-2.9.4-.3V4.2l-.3-.4a.76.76,0,0,0-1.1,0l-.3.4a.85.85,0,0,0,0,1.1l.4.3V19.4l-.4.3a.85.85,0,0,0,0,1.1l.3.4a.76.76,0,0,0,1.1,0Z"/>
        <path d="M14.9,4.2l.3.4a.85.85,0,0,0,0-1.1L14.9,3.1l-.4.3L12,6h0l2.9,2.9.4.3a.85.85,0,0,0,1.1,0l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3Z" transform="translate(24) scale(-1, 1)"/>
    </svg>
);

const InstallButtons = () => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (!isInstallable && !isApple) return null;
    
    return (
        <div className="flex flex-col sm:flex-row gap-3">
             {isApple && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-center gap-2">
                            <AppleIcon className="h-5 w-5" />
                            <span>Obtenir pour iPhone</span>
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Installer l'application sur iOS</DialogTitle>
                            <DialogDescription>
                                Pour installer l'application sur votre iPhone ou iPad, suivez ces étapes simples :
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                            <p>1. Appuyez sur le bouton de Partage dans la barre d'outils de Safari.</p>
                            <div className="flex justify-center"><Share className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                            <p>2. Faites défiler vers le bas et sélectionnez "Ajouter à l'écran d'accueil".</p>
                            <div className="flex justify-center"><PlusSquare className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                            <p>3. Appuyez sur "Ajouter" pour confirmer.</p>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {isInstallable && (
                 <Button onClick={promptInstall} variant="outline" className="w-full justify-center gap-2">
                     <AndroidIcon className="h-5 w-5" />
                     <span>Obtenir pour Android</span>
                </Button>
            )}
        </div>
    )
}

export function SiteFooter() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const docRef = doc(db, "settings", "siteInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSiteInfo(docSnap.data() as SiteInfo);
        }
      } catch (error) {
        console.error("Error fetching site info:", error);
      }
    };
    fetchSiteInfo();
  }, []);

  return (
    <footer className="border-t bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand and Info */}
            <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE Logo" width={40} height={40} className="rounded-full object-cover" />
                    <span className="font-headline text-lg font-bold tracking-wide">LE QG DE LA SAPE</span>
                </Link>
                <p className="text-sm text-muted-foreground">
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
             {/* Column 3: App Install */}
             <div>
                <h3 className="font-headline font-semibold mb-4 text-center md:text-left">Application Mobile</h3>
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground text-center md:text-left">Accédez à notre boutique plus rapidement.</p>
                    <InstallButtons />
                </div>
            </div>
             {/* Column 4: Contact & Social */}
             <div>
                <h3 className="font-headline font-semibold mb-4 text-center md:text-left">Contactez-nous</h3>
                <ul className="space-y-3 text-sm text-center md:text-left">
                   {siteInfo?.customerServicePhone && (
                     <li className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                        <Phone className="h-4 w-4" />
                        <span>{siteInfo.customerServicePhone}</span>
                    </li>
                   )}
                   {siteInfo?.storeAddress && (
                     <li className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                        <MapPin className="h-4 w-4" />
                        <span>{siteInfo.storeAddress}</span>
                    </li>
                   )}
                </ul>
                <div className="flex gap-2 mt-4 justify-center md:justify-start">
                    {siteInfo?.whatsappNumber && (
                        <Button variant="ghost" size="icon" asChild>
                            <a href={`https://wa.me/${siteInfo.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp className="h-5 w-5"/>
                            </a>
                        </Button>
                    )}
                    {siteInfo?.facebookUrl && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={siteInfo.facebookUrl} target="_blank"><Facebook className="h-5 w-5"/></Link>
                        </Button>
                    )}
                     {siteInfo?.tiktokUrl && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={siteInfo.tiktokUrl} target="_blank"><FaTiktok className="h-5 w-5"/></Link>
                        </Button>
                    )}
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

    