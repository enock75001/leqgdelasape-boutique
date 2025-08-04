
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function OrderConfirmationPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) {
                router.push('/');
                return;
            };

            setIsLoading(true);
            try {
                const orderRef = doc(db, 'orders', id);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
                } else {
                    console.warn("Order not found");
                    // Optionally redirect or show a 'not found' message
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!order) {
        return (
             <div className="container mx-auto py-16 text-center">
                <h1 className="text-3xl font-bold text-destructive">Commande non trouvée</h1>
                <p className="mt-4 text-muted-foreground">Nous n'avons pas pu trouver les détails de cette commande. Veuillez vérifier le lien ou contacter le support.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Retour à l'accueil</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-16">
            <Card className="w-full shadow-lg">
                <CardHeader className="text-center bg-muted/30 p-8">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-3xl font-headline">Merci pour votre commande !</CardTitle>
                    <CardDescription className="text-lg">Votre commande a été passée avec succès.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-center text-muted-foreground">
                        Un e-mail de confirmation a été envoyé à <strong>{order.customerEmail}</strong>.
                        <br />
                        Votre numéro de commande est le <strong className="font-mono text-primary">{order.id.slice(-6)}</strong>.
                    </p>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                         <h3 className="font-semibold text-lg">Récapitulatif de la commande</h3>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.productId}>
                                        <TableCell>
                                            {item.productName} &times; {item.quantity}
                                            <div className="text-xs text-muted-foreground">
                                                {item.variant.size}, {item.variant.color}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{(item.price * item.quantity).toFixed(2)} FCFA</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell>Frais de livraison</TableCell>
                                    <TableCell className="text-right">{order.shippingCost.toFixed(2)} FCFA</TableCell>
                                </TableRow>
                                <TableRow className="font-bold text-lg">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{order.total.toFixed(2)} FCFA</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                     <Separator />

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <h4 className="font-semibold">Adresse de livraison</h4>
                            <p className="text-muted-foreground">{order.customerName}<br />{order.shippingAddress}</p>
                        </div>
                         <div className="space-y-1">
                            <h4 className="font-semibold">Moyen de paiement</h4>
                            <p className="text-muted-foreground">{order.paymentMethod}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-6 flex justify-center">
                     <Button asChild>
                        <Link href="/">Continuer les achats</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

