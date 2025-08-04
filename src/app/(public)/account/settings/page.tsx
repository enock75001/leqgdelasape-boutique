
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddressPage() {
    const { toast } = useToast();
    
    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Adresse enregistrée", description: "Votre adresse de livraison a été mise à jour." });
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
                            <Label htmlFor="address">Adresse Complète</Label>
                            <Textarea 
                                id="address" 
                                placeholder="123 Fashion Ave, Style City, Chic, 54321" 
                                rows={4}
                            />
                        </div>
                        <Button type="submit">Enregistrer l'adresse</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
