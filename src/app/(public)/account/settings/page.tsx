
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, MapPin, Home, Building } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Separator } from "@/components/ui/separator";

type Address = {
    line1: string;
    line2?: string;
    city: string;
    postalCode?: string;
}

export default function AddressPage() {
    const { user, loading, refreshAuth } = useAuth();
    const { toast } = useToast();
    const [shippingAddress, setShippingAddress] = useState<Address>({ line1: '', city: '' });
    const [billingAddress, setBillingAddress] = useState<Address>({ line1: '', city: '' });
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            getDoc(userRef).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.shippingAddress) setShippingAddress(data.shippingAddress);
                    if (data.billingAddress) setBillingAddress(data.billingAddress);
                    if (data.shippingAddress && data.billingAddress) {
                        setUseSameAddress(JSON.stringify(data.shippingAddress) === JSON.stringify(data.billingAddress));
                    }
                }
            });
        }
    }, [user]);

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const addressesToSave: { shippingAddress: Address, billingAddress?: Address } = {
            shippingAddress
        };
        
        if (useSameAddress) {
            addressesToSave.billingAddress = shippingAddress;
        } else {
            addressesToSave.billingAddress = billingAddress;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, addressesToSave, { merge: true });
            refreshAuth();
            toast({ title: "Adresse enregistrée", description: "Vos adresses ont été mises à jour avec succès." });
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur", description: "Impossible de sauvegarder les adresses.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGeolocate = async () => {
        if (!navigator.geolocation) {
          toast({ title: "Erreur", description: "La géolocalisation n'est pas supportée par votre navigateur.", variant: "destructive" });
          return;
        }
        setIsLocating(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            if (data && data.address) {
                setShippingAddress({
                    line1: data.address.road || '',
                    city: data.address.city || data.address.town || data.address.village || '',
                    postalCode: data.address.postcode || '',
                });
                toast({ title: "Position trouvée", description: "Votre adresse a été pré-remplie." });
            } else {
                 toast({ title: "Position trouvée", description: "Coordonnées insérées, mais impossible de trouver l'adresse." });
            }
        } catch (error: any) {
            let message = "Impossible d'obtenir votre position.";
            if (error.code === error.PERMISSION_DENIED) {
                message = "Vous avez refusé l'accès à votre position.";
            }
            toast({ title: "Erreur de géolocalisation", description: message, variant: "destructive" });
        } finally {
            setIsLocating(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/account">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-headline font-bold">Adresses</h1>
                    <p className="text-muted-foreground">Gérez vos adresses de livraison et de facturation.</p>
                </div>
            </div>

            <form onSubmit={handleAddressSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Home className="h-6 w-6 text-primary"/>
                            <CardTitle>Adresse de Livraison</CardTitle>
                        </div>
                        <CardDescription>L'adresse où vous souhaitez recevoir vos commandes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={isLocating}>
                            {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                            Utiliser ma position actuelle
                        </Button>
                        <div className="space-y-2">
                            <Label htmlFor="shipping-line1">Adresse</Label>
                            <Input id="shipping-line1" value={shippingAddress.line1} onChange={(e) => setShippingAddress(prev => ({...prev, line1: e.target.value}))} placeholder="Ex: 123 Rue de la Mode" required/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="shipping-city">Ville</Label>
                                <Input id="shipping-city" value={shippingAddress.city} onChange={(e) => setShippingAddress(prev => ({...prev, city: e.target.value}))} placeholder="Ex: Abidjan" required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shipping-postal">Code Postal (Optionnel)</Label>
                                <Input id="shipping-postal" value={shippingAddress.postalCode || ''} onChange={(e) => setShippingAddress(prev => ({...prev, postalCode: e.target.value}))} placeholder="Ex: 75001"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="same-address" checked={useSameAddress} onChange={(e) => setUseSameAddress(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                    <Label htmlFor="same-address" className="text-sm font-medium">Utiliser la même adresse pour la facturation</Label>
                </div>

                {!useSameAddress && (
                    <Card>
                         <CardHeader>
                            <div className="flex items-center gap-3">
                                <Building className="h-6 w-6 text-primary"/>
                                <CardTitle>Adresse de Facturation</CardTitle>
                            </div>
                            <CardDescription>L'adresse qui apparaîtra sur vos factures.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="billing-line1">Adresse</Label>
                                <Input id="billing-line1" value={billingAddress.line1} onChange={(e) => setBillingAddress(prev => ({...prev, line1: e.target.value}))} placeholder="Ex: 123 Rue de la Mode" required/>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="billing-city">Ville</Label>
                                    <Input id="billing-city" value={billingAddress.city} onChange={(e) => setBillingAddress(prev => ({...prev, city: e.target.value}))} placeholder="Ex: Abidjan" required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billing-postal">Code Postal (Optionnel)</Label>
                                    <Input id="billing-postal" value={billingAddress.postalCode || ''} onChange={(e) => setBillingAddress(prev => ({...prev, postalCode: e.target.value}))} placeholder="Ex: 75001"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer les adresses
                    </Button>
                 </div>
            </form>
        </div>
    );
}
