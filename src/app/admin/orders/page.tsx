
'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/lib/mock-data";
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';

const getOrderStatusUpdateEmailHtml = (orderId: string, status: string, customerName: string) => {
    let message = '';
    switch (status) {
        case 'Shipped':
            message = 'Bonne nouvelle ! Votre commande est en cours d\'acheminement.';
            break;
        case 'Delivered':
            message = 'Votre commande a été livrée. Nous espérons qu\'elle vous plaît !';
            break;
        case 'Cancelled':
            message = 'Votre commande a été annulée. Si vous avez des questions, n\'hésitez pas à nous contacter.';
            break;
        default:
            return '';
    }

    return `
        <h1>Mise à jour du statut de votre commande</h1>
        <p>Bonjour ${customerName},</p>
        <p>Le statut de votre commande #${orderId.slice(-6)} est maintenant : <strong>${status}</strong>.</p>
        <p>${message}</p>
        <p>Merci de votre confiance,</p>
        <p>L'équipe LE QG DE LA SAPE</p>
    `;
};


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "orders"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(allOrders);
    } catch (error) {
        console.error("Error fetching orders: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les commandes.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [toast]);

  const handleUpdateStatus = async (orderId: string, customerEmail: string, customerName: string, status: 'Shipped' | 'Delivered' | 'Cancelled') => {
      try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, { status: status });
          
          setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));

          toast({
              title: "Statut mis à jour",
              description: `La commande ${orderId.slice(-6)} est maintenant marquée comme ${status}.`
          });
          
          // Send email notification to customer
          const emailHtml = getOrderStatusUpdateEmailHtml(orderId, status, customerName);
          if (emailHtml && customerEmail) {
              await sendEmail({
                  to: customerEmail,
                  subject: `Mise à jour concernant votre commande ${orderId.slice(-6)}`,
                  htmlContent: emailHtml
              });
          }

      } catch (error) {
          console.error("Error updating order status:", error);
          toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive"});
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes</CardTitle>
        <CardDescription>Consultez et gérez les commandes des clients depuis Firestore.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                    <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                        <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.total.toFixed(2)} FCFA</TableCell>
                    <TableCell>
                    <Badge 
                        variant={
                            order.status === 'Delivered' ? 'default' :
                            order.status === 'Shipped' ? 'secondary' :
                            order.status === 'Cancelled' ? 'destructive' :
                            'outline'
                        }
                        className={
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''
                        }
                    >
                        {order.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, order.customerEmail, order.customerName, 'Shipped')}>
                                    Marquer comme Expédiée
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, order.customerEmail, order.customerName, 'Delivered')}>
                                    Marquer comme Livrée
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(order.id, order.customerEmail, order.customerName, 'Cancelled')}>
                                    Annuler la commande
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
