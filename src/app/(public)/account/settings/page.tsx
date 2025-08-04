'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const { toast } = useToast();
    
    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Adresse enregistrée", description: "Votre adresse de livraison a été mise à jour." });
    }

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Moyen de paiement enregistré", description: "Votre moyen de paiement a été mis à jour." });
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
                    <h1 className="text-3xl font-headline font-bold">Paramètres</h1>
                    <p className="text-muted-foreground">Gérez les adresses et les moyens de paiement.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Adresse de livraison</CardTitle>
                    <CardDescription>Votre adresse de livraison principale.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label htmlFor="address-1">Ligne d'adresse 1</Label>
                            <Input id="address-1" placeholder="123 Fashion Ave" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input id="city" placeholder="Style City" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">État / Province</Label>
                                <Input id="state" placeholder="Chic" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">Code postal</Label>
                                <Input id="zip" placeholder="54321" />
                            </div>
                        </div>
                        <Button type="submit">Enregistrer l'adresse</Button>
                    </form>
                </CardContent>
            </Card>
            
            <Card>
                    <CardHeader>
                    <CardTitle>Moyen de paiement</CardTitle>
                    <CardDescription>Votre moyen de paiement principal.</CardDescription>
                </CardHeader>
                <CardContent>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label htmlFor="card-number">Numéro de carte</Label>
                            <Input id="card-number" placeholder="**** **** **** 1234" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                <Label htmlFor="expiry">Date d'expiration</Label>
                                <Input id="expiry" placeholder="MM / YY" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input id="cvc" placeholder="123" />
                            </div>
                        </div>
                        <Button type="submit">Enregistrer le paiement</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
