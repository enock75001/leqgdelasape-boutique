
'use client';

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/lib/mock-data";
import { ArrowLeft, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrderReceipt } from '@/components/orders/order-receipt';

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.email) {
                setIsLoading(false);
                return;
            };

            setIsLoading(true);
            try {
                // Simplified query without server-side ordering
                const q = query(
                    collection(db, "orders"), 
                    where("customerEmail", "==", user.email)
                );
                const querySnapshot = await getDocs(q);
                const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                
                // Sort orders on the client-side
                userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setOrders(userOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger l'historique des commandes. Vérifiez votre connexion ou contactez le support.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        } else {
            setIsLoading(false);
        }
    }, [user, toast]);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/account">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-headline font-bold">Mes Commandes</h1>
                    <p className="text-muted-foreground">Voici la liste de vos commandes passées et présentes.</p>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Vous n'avez pas encore passé de commande.</p>
                            <Button asChild className="mt-4">
                                <Link href="/">Commencer les achats</Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Commande</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    order.status === 'Delivered' ? 'default' :
                                                        order.status === 'Shipped' ? 'secondary' : 'destructive'
                                                }
                                                className={
                                                    order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{order.total.toFixed(2)} FCFA</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir le reçu
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Reçu de la commande #{order.id.slice(-6)}</DialogTitle>
                                                    </DialogHeader>
                                                    <OrderReceipt order={order} />
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
