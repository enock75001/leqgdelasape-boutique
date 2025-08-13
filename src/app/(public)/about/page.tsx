
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

const AppInstallButtons = () => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (!isInstallable && !isApple) return null;
    
    return (
        <div className="flex flex-col sm:flex-row gap-4">
             {isApple && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="lg" className="w-full justify-center gap-2 text-lg py-6">
                            <Image src="https://i.postimg.cc/T342Dqr1/Android-i-OS-Windows-Operating-System-Icons-Copie.jpg" alt="iPhone" width={24} height={24} />
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
                     <Image src="https://i.postimg.cc/fRLTygS1/Android-iOS-&-Windows-Operating-System-Icons_-_Copie_(2).jpg" alt="Android" width={24} height={24} />
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

    
