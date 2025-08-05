
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import { OrderReceipt } from '@/components/orders/order-receipt';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [id, router]);
    
    const handlePrint = () => {
        window.print();
    }

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
        <div className="container mx-auto max-w-4xl py-12 md:py-20">
            <Card className="w-full shadow-lg print:shadow-none print:border-none">
                <CardHeader className="text-center bg-muted/30 p-8 print:hidden">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-3xl font-headline">Merci pour votre commande !</CardTitle>
                    <CardDescription className="text-lg">Votre commande a été passée avec succès.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-8 space-y-6">
                    <p className="text-center text-muted-foreground print:hidden">
                        Un e-mail de confirmation a été envoyé à <strong>{order.customerEmail}</strong>.
                    </p>
                    <OrderReceipt order={order} />
                </CardContent>
                <CardFooter className="bg-muted/30 p-6 flex-col sm:flex-row justify-center gap-4 print:hidden">
                     <Button asChild>
                        <Link href="/">Continuer les achats</Link>
                    </Button>
                     <Button variant="outline" onClick={handlePrint}>
                        <Download className="mr-2 h-4 w-4"/>
                        Imprimer / Télécharger en PDF
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
