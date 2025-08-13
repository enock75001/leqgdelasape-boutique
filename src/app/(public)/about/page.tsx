'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { SiteInfo } from '@/lib/mock-data';
import { doc, getDoc } from 'firebase/firestore';
import { AtSign, Clock, MapPin, Phone, Share, Smartphone, PlusSquare, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTiktok, FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { usePwa } from '@/context/pwa-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.02,2.5C10.36,2.5,8.82,3.43,8.06,4.72C7,5.55,6.08,7.34,6.08,8.86c0,2.44,1.83,3.61,2,3.65c0.1,0.04,0.1,0.04,0.1,0.04c-2.31,1.48-2.92,4.35-2.92,4.35c0.12,0,2.14-1.28,3.78-1.28c1.55,0,2.69,0.76,3.58,0.76c0.85,0,2.06-0.76,3.58-0.76c1.64,0,3.62,1.28,3.75,1.28c0,0-0.61-2.87-2.92-4.35c0,0,0,0,0.06,0c0.18-0.04,2-1.21,2-3.65c0-1.52-0.92-3.31-2-4.14C15.22,3.43,13.68,2.5,12.02,2.5z M12.63,4.61c0.76-0.87,2.14-1,2.8-0.2c-0.22,0.68-0.91,1.36-1.63,1.95c-0.72,0.6-1.55,1.19-2.53,0.91C11.53,6.86,11.83,5.55,12.63,4.61z"/>
    </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M15.47,8.39l1.49-1.49A.5.5,0,0,0,16.6,6.2l-1.5,1.5A6.47,6.47,0,0,0,12,7a6.47,6.47,0,0,0-3.1.7L7.4,6.2a.5.5,0,0,0-.71.71l1.49,1.49A6.5,6.5,0,0,0,6,12.75V15.5a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V12.75A6.5,6.5,0,0,0,15.47,8.39ZM9.5,14a.5.5,0,0,1,0-1h5a.5.5,0,0,1,0,1Zm-.75-3.5a.75.75,0,1,1,.75-.75A.75.75,0,0,1,8.75,10.5Zm6.5,0a.75.75,0,1,1,.75-.75A.75.75,0,0,1,15.25,10.5Z"/>
    </svg>
);

const AppInstallButtons = () => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (!isInstallable && !isApple) return null;
    
    return (
        <div className="flex flex-col sm:flex-row gap-4">
             {isApple && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="lg" className="w-full justify-center gap-2 text-lg py-6">
                            <AppleIcon className="h-6 w-6" />
                            <span>Télécharger pour iPhone</span>
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
                 <Button onClick={promptInstall} variant="outline" size="lg" className="w-full justify-center gap-2 text-lg py-6">
                     <AndroidIcon className="h-6 w-6" />
                     <span>Télécharger pour Android</span>
                </Button>
            )}
        </div>
    )
}

export default function AboutPage() {
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
        <div className="bg-background/80">
            <div className="container mx-auto px-4 py-16 space-y-20">

                {/* Header Section */}
                <header className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE Logo" width={80} height={80} className="rounded-full object-cover shadow-lg" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary">LE QG DE LA SAPE</h1>
                    <p className="mt-4 text-xl md:text-2xl text-muted-foreground">L'Élégance a son Quartier Général</p>
                </header>
                
                {/* Our Story Section */}
                <section className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl">
                         <Image src="https://i.postimg.cc/0QRb33k0/Whats-App-Image-2025-07-31-16-20-22-5f066cfa.jpg" alt="Ambiance de la boutique" layout="fill" objectFit="cover" className="transform hover:scale-105 transition-transform duration-500"/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-headline font-bold mb-4">Notre Histoire</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Née de la passion pour la mode et d'un désir de rendre le style accessible, LE QG DE LA SAPE est plus qu'une simple boutique. C'est un mouvement. Nous croyons que chaque vêtement est une déclaration, une façon d'exprimer qui vous êtes sans dire un mot.
                        </p>
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                            Notre mission est de dénicher les pièces les plus tendances et de la plus haute qualité, pour vous offrir une garde-robe qui vous donne confiance et vous distingue. Bienvenue dans notre quartier général, où votre style prend vie.
                        </p>
                    </div>
                </section>

                 {/* App Install Section */}
                 <section className="bg-card p-8 rounded-lg shadow-lg">
                    <div className="max-w-2xl mx-auto text-center">
                        <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-3xl font-headline font-bold mb-4">Emportez la boutique partout</h2>
                        <p className="text-muted-foreground mb-6">
                            Installez notre application pour une expérience d'achat optimisée, des notifications sur les nouveautés et un accès exclusif à nos offres.
                        </p>
                        <AppInstallButtons />
                    </div>
                 </section>

                {/* Contact and Socials Section */}
                <section>
                    <div className="text-center mb-12">
                         <h2 className="text-3xl font-headline font-bold">Restons Connectés</h2>
                         <p className="text-muted-foreground mt-2">Nous sommes toujours là pour vous.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="text-center">
                            <CardHeader>
                                <Phone className="h-8 w-8 mx-auto text-primary mb-2"/>
                                <CardTitle>Par Téléphone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {siteInfo?.customerServicePhone ? (
                                        <a href={`tel:${siteInfo.customerServicePhone}`} className="hover:underline">{siteInfo.customerServicePhone}</a>
                                    ) : 'Non disponible'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <MapPin className="h-8 w-8 mx-auto text-primary mb-2"/>
                                <CardTitle>Notre Boutique</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {siteInfo?.storeAddress || 'Adresse non disponible'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader>
                                <Heart className="h-8 w-8 mx-auto text-primary mb-2"/>
                                <CardTitle>Suivez-nous</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-center gap-4">
                                     {siteInfo?.whatsappNumber && (
                                        <a href={`https://wa.me/${siteInfo.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><FaWhatsapp className="h-6 w-6"/></a>
                                    )}
                                    {siteInfo?.facebookUrl && (
                                        <a href={siteInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><FaFacebook className="h-6 w-6"/></a>
                                    )}
                                    {siteInfo?.tiktokUrl && (
                                        <a href={siteInfo.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><FaTiktok className="h-6 w-6"/></a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

            </div>
        </div>
    );
}
