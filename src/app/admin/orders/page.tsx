
'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/lib/mock-data";
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Loader2, MoreHorizontal, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrderReceipt } from '@/components/orders/order-receipt';

const statusTranslations: { [key: string]: string } = {
  Pending: 'En attente',
  Shipped: 'Expédiée',
  Delivered: 'Livrée',
  Cancelled: 'Annulée',
};

const getOrderStatusUpdateEmailHtml = (orderId: string, status: string, customerName: string) => {
    let messageTitle = '';
    let messageBody = '';
    const translatedStatus = statusTranslations[status] || status;

    switch (status) {
        case 'Shipped':
            messageTitle = 'Votre commande est en route !';
            messageBody = 'Bonne nouvelle ! Votre commande a été expédiée et est en cours d\'acheminement. Vous pourrez bientôt profiter de vos nouveaux articles.';
            break;
        case 'Delivered':
            messageTitle = 'Votre commande a été livrée !';
            messageBody = 'Votre colis a été livré. Nous espérons que vos articles vous plaisent et nous vous remercions de votre confiance.';
            break;
        case 'Cancelled':
            messageTitle = 'Votre commande a été annulée.';
            messageBody = 'Conformément à votre demande ou à une mise à jour, votre commande a été annulée. Si vous avez des questions, n\'hésitez pas à nous contacter.';
            break;
        default:
            return ''; // Ne pas envoyer d'email pour les autres statuts
    }

    return `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #0d9488; padding: 20px; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">LE QG DE LA SAPE</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px;">${messageTitle}</h2>
                                <p>Bonjour ${customerName},</p>
                                <p style="margin-bottom: 25px;">Le statut de votre commande <strong>#${orderId.slice(-6)}</strong> a été mis à jour : <strong>${translatedStatus}</strong>.</p>
                                <p style="line-height: 1.6;">${messageBody}</p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                                <p style="margin: 0;">Pour toute question, contactez notre service client.</p>
                                <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} LE QG DE LA SAPE</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
      </body>
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
  }, []);

  const handleUpdateStatus = async (orderId: string, customerEmail: string, customerName: string, status: 'Shipped' | 'Delivered' | 'Cancelled') => {
      try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, { status: status });
          
          setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));

          toast({
              title: "Statut mis à jour",
              description: `La commande ${orderId.slice(-6)} est maintenant marquée comme ${statusTranslations[status]}.`
          });
          
          // Send email notification to customer
          const emailHtml = getOrderStatusUpdateEmailHtml(orderId, status, customerName);
          if (emailHtml && customerEmail) {
              const result = await sendEmail({
                  to: customerEmail,
                  subject: `Mise à jour concernant votre commande #${orderId.slice(-6)}`,
                  htmlContent: emailHtml
              });
              if (!result.success) {
                  console.warn(`L'e-mail de mise à jour de statut pour ${customerEmail} a échoué.`, result.message);
                   toast({ title: "Avertissement", description: "Le statut de la commande a été mis à jour, mais l'e-mail au client n'a pas pu être envoyé.", variant: "destructive"});
              }
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
                    <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                    <TableCell>
                        <div>{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                        <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{Math.round(order.total)} FCFA</TableCell>
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
                        {statusTranslations[order.status] || order.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Ouvrir le menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir le reçu
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DropdownMenuSeparator />
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
                             <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Reçu de la commande #{order.id.slice(-6)}</DialogTitle>
                                </DialogHeader>
                                <OrderReceipt order={order} showDownloadButton={true} />
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
  );
}
