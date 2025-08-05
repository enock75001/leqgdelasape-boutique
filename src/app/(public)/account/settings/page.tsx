
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AddressPage() {
    const { toast } = useToast();
    const [address, setAddress] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    
    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Adresse enregistrée", description: "Votre adresse de livraison a été mise à jour." });
    }
    
    const handleGeolocate = () => {
        if (!navigator.geolocation) {
          toast({ title: "Erreur", description: "La géolocalisation n'est pas supportée par votre navigateur.", variant: "destructive" });
          return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        setAddress(data.display_name);
                        toast({ title: "Position trouvée", description: "Votre adresse a été mise à jour." });
                    } else {
                        setAddress(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
                        toast({ title: "Position trouvée", description: "Coordonnées insérées, mais impossible de trouver l'adresse." });
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                    setAddress(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
                    toast({ title: "Erreur de géocodage", description: "Impossible de convertir les coordonnées en adresse.", variant: "destructive" });
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                let message = "Impossible d'obtenir votre position.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Vous avez refusé l'accès à votre position.";
                }
                toast({ title: "Erreur de géolocalisation", description: message, variant: "destructive" });
                setIsLocating(false);
            }
        );
      };

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
                    <p className="text-muted-foreground">Gérez vos adresses de livraison.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Adresse de livraison</CardTitle>
                    <CardDescription>Votre adresse de livraison principale pour un passage en caisse plus rapide.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                             <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="address">Adresse Complète</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                    Utiliser ma position
                                </Button>
                            </div>
                            <Textarea 
                                id="address" 
                                placeholder="Abidjan, Port-Bouët, Adjouffou" 
                                rows={4}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Enregistrer l'adresse</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
