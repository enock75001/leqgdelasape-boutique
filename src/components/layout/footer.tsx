
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

const InstallButtons = () => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (!isInstallable && !isApple) return null;
    
    return (
        <div className="flex flex-col sm:flex-row gap-3">
             {isApple && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-center gap-2">
                            <Image src="https://i.postimg.cc/T342Dqr1/Android-i-OS-Windows-Operating-System-Icons-Copie.jpg" alt="iPhone" width={20} height={20} />
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
                     <Image src="https://i.postimg.cc/fRLTygS1/Android-iOS-&-Windows-Operating-System-Icons_-_Copie_(2).jpg" alt="Android" width={20} height={20} />
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
                     <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">À Propos</Link></li>
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

    
