
'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { PaymentMethod, ShippingMethod, Order, OrderItem, Coupon } from '@/lib/mock-data';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, Timestamp, doc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';


// Modèles d'e-mails
const getOrderConfirmationEmailHtml = (order: Omit<Order, 'id'>, orderId: string) => {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.productName} ${item.variant ? `(${item.variant.size}, ${item.variant.color})` : ''}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)} FCFA</td>
        </tr>
    `).join('');

    return `
        <h1>Merci pour votre commande, ${order.customerName} !</h1>
        <p>Votre commande #${orderId.slice(-6)} a été confirmée.</p>
        <h2>Récapitulatif de la commande :</h2>
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>
        <p><strong>Total : ${order.total.toFixed(2)} FCFA</strong></p>
        <p>Adresse de livraison : ${order.shippingAddress}</p>
        <p>Merci de votre confiance !</p>
        <p>L'équipe LE QG DE LA SAPE</p>
    `;
};

const getAdminNotificationEmailHtml = (order: Omit<Order, 'id'>, orderId: string) => {
    return `
        <h1>Nouvelle commande reçue !</h1>
        <p>Une nouvelle commande #${orderId.slice(-6)} a été passée sur LE QG DE LA SAPE.</p>
        <p><strong>Client :</strong> ${order.customerName} (${order.customerEmail})</p>
        <p><strong>Montant total :</strong> ${order.total.toFixed(2)} FCFA</p>
        <p>Veuillez consulter le tableau de bord pour plus de détails.</p>
    `;
};

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(true);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
        setLoadingPaymentMethods(true);
        try {
            const q = query(collection(db, "paymentMethods"), where("enabled", "==", true));
            const querySnapshot = await getDocs(q);
            const methods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
            setPaymentMethods(methods);
            if (methods.length > 0) {
                setSelectedPaymentMethod(methods[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch payment methods:", error);
            toast({ title: "Erreur", description: "Impossible de charger les moyens de paiement.", variant: "destructive" });
        } finally {
            setLoadingPaymentMethods(false);
        }
    }
    const fetchShippingMethods = async () => {
        setLoadingShippingMethods(true);
        try {
            const q = query(collection(db, "shippingMethods"), where("enabled", "==", true));
            const querySnapshot = await getDocs(q);
            const methods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingMethod));
            setShippingMethods(methods);
            if (methods.length > 0) {
                setSelectedShippingMethod(methods[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch shipping methods:", error);
            toast({ title: "Erreur", description: "Impossible de charger les moyens de livraison.", variant: "destructive" });
        } finally {
            setLoadingShippingMethods(false);
        }
    }
    fetchPaymentMethods();
    fetchShippingMethods();
  }, [toast]);


  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = useMemo(() => {
    if (!selectedShippingMethod) return 0;
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method ? method.price : 0;
  }, [selectedShippingMethod, shippingMethods]);
  
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
        toast({ title: "Code Invalide", description: "Veuillez entrer un code.", variant: "destructive" });
        return;
    }
    try {
        const couponsRef = collection(db, "coupons");
        const q = query(couponsRef, where("code", "==", couponCode.toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            setDiscount(0);
            toast({ title: "Code Invalide", description: "Ce code de réduction n'existe pas.", variant: "destructive" });
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const coupon = couponDoc.data() as Coupon;
        const expiresAt = (coupon.expiresAt as unknown as Timestamp).toDate();

        if (expiresAt < new Date()) {
            setDiscount(0);
            toast({ title: "Code Expiré", description: "Ce code de réduction a expiré.", variant: "destructive" });
        } else {
            setDiscount(coupon.discount / 100);
            toast({ title: "Code Appliqué", description: `Vous bénéficiez de ${coupon.discount}% de réduction.` });
        }
    } catch (error) {
        console.error("Error validating coupon:", error);
        setDiscount(0);
        toast({ title: "Erreur", description: "Impossible de valider le code.", variant: "destructive" });
    }
  };

  const handlePlaceOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPlacingOrder(true);

    const formData = new FormData(event.currentTarget);
    const customerName = formData.get('name') as string;
    const shippingAddress = formData.get('address') as string;
    const customerEmail = formData.get('email') as string;

    if (cart.length === 0) {
        toast({ title: "Votre panier est vide", description: "Veuillez ajouter des produits à votre panier.", variant: "destructive" });
        setIsPlacingOrder(false);
        return;
    }
    if (!selectedPaymentMethod || !selectedShippingMethod) {
        toast({ title: "Informations manquantes", description: "Veuillez sélectionner un moyen de livraison et de paiement.", variant: "destructive" });
        setIsPlacingOrder(false);
        return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const shippingMethodName = shippingMethods.find(s => s.id === selectedShippingMethod)?.name || 'N/A';
    const paymentMethodName = paymentMethods.find(p => p.id === selectedPaymentMethod)?.name || 'N/A';

    const orderData: Omit<Order, 'id'> = {
        userId: user?.email || null,
        customerName,
        customerEmail,
        shippingAddress,
        date: Timestamp.now().toDate().toISOString(),
        total,
        status: 'Pending',
        items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            variant: item.variant,
        })),
        shippingMethod: shippingMethodName,
        shippingCost,
        paymentMethod: paymentMethodName,
    };
    
    try {
        const orderDocRef = await addDoc(collection(db, "orders"), orderData);
        const finalOrderId = orderDocRef.id;

        // Envoyer l'e-mail de confirmation au client
        await sendEmail({
            to: customerEmail,
            subject: 'Confirmation de votre commande LE QG DE LA SAPE',
            htmlContent: getOrderConfirmationEmailHtml(orderData, finalOrderId),
        });

        // Envoyer l'e-mail de notification à l'administrateur
        await sendEmail({
            to: 'admin@example.com', // Remplacez par l'e-mail de l'administrateur
            subject: `Nouvelle commande reçue : ${finalOrderId.slice(-6)}`,
            htmlContent: getAdminNotificationEmailHtml(orderData, finalOrderId),
        });

        // Notifier l'administrateur dans l'interface
        addNotification({
            recipient: 'admin',
            message: `Nouvelle commande ${finalOrderId.slice(-6)} reçue pour ${total.toFixed(2)} FCFA.`,
        });

        // Notifier le client dans l'interface s'il est connecté
        if(user) {
            addNotification({
                recipient: 'client',
                userEmail: user.email,
                message: `Votre commande ${finalOrderId.slice(-6)} a été passée avec succès.`,
            });
        }

        toast({
          title: 'Commande passée !',
          description: 'Merci pour votre achat. Nous la traiterons sous peu.',
        });
        clearCart();
        setDiscount(0);
        setCouponCode('');
        router.push('/account/orders');

    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Erreur", description: "Impossible de passer la commande. Veuillez réessayer.", variant: "destructive" });
    } finally {
        setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary">Votre Panier</h1>
      </div>
      {cart.length === 0 ? (
        <div className="text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">Votre panier est vide.</p>
          <Button asChild className="mt-6">
            <Link href="/">Commencer les achats</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder}>
            <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Articles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                             <TableBody>
                                {cart.map(item => (
                                <TableRow key={item.product.id + JSON.stringify(item.variant)} className="border-t">
                                    <TableCell className="p-4">
                                        <div className="relative h-20 w-20 rounded-md overflow-hidden">
                                            <Image src={item.product.imageUrls?.[0] || 'https://placehold.co/100x100.png'} alt={item.product.name} fill objectFit="cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <h3 className="font-semibold">{item.product.name}</h3>
                                        {item.variant && (
                                            <p className="text-sm text-muted-foreground">
                                            {item.variant.size}, {item.variant.color}
                                            </p>
                                        )}
                                         <p className="text-sm text-muted-foreground md:hidden">{item.product.price.toFixed(2)} FCFA</p>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{item.product.price.toFixed(2)} FCFA</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}>
                                                <MinusCircle className="h-5 w-5" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}>
                                                <PlusCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-right">{(item.product.price * item.quantity).toFixed(2)} FCFA</TableCell>
                                    <TableCell className="text-right">
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.product.id, item.variant)}>
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                             </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Informations de livraison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" name="name" type="text" placeholder="John Doe" required />
                        </div>
                        <div>
                            <Label htmlFor="address">Adresse de livraison</Label>
                            <Input id="address" name="address" type="text" placeholder="123 Fashion Ave" required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={user?.email} required />
                        </div>
                    </CardContent>
                </Card>

            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Récapitulatif</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="coupon">Code de réduction</Label>
                            <div className="flex space-x-2">
                                <Input 
                                    id="coupon" 
                                    placeholder="Entrez votre code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                                <Button type="button" onClick={handleApplyCoupon}>Appliquer</Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                             <div className="flex justify-between">
                                <span>Sous-total</span>
                                <span>{subtotal.toFixed(2)} FCFA</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Réduction ({discount * 100}%)</span>
                                    <span>-{discountAmount.toFixed(2)} FCFA</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Frais de port</span>
                                <span>{shippingCost.toFixed(2)} FCFA</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{total.toFixed(2)} FCFA</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Options de paiement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label>Moyen de livraison</Label>
                            {loadingShippingMethods ? (
                                <div className="flex items-center justify-center pt-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : shippingMethods.length > 0 ? (
                                <RadioGroup 
                                    value={selectedShippingMethod} 
                                    onValueChange={setSelectedShippingMethod}
                                    className="mt-2 space-y-2"
                                >
                                {shippingMethods.map(method => (
                                    <label key={method.id} htmlFor={`ship-${method.id}`} className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors", selectedShippingMethod === method.id ? "bg-primary/10 border-primary" : "hover:bg-accent/50")}>
                                      <div className="flex items-center space-x-3">
                                        <RadioGroupItem value={method.id} id={`ship-${method.id}`} />
                                        <Label htmlFor={`ship-${method.id}`} className="font-medium cursor-pointer">{method.name}</Label>
                                      </div>
                                      <span className="text-sm font-semibold">{method.price.toFixed(2)} FCFA</span>
                                    </label>
                                ))}
                                </RadioGroup>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">Aucun moyen de livraison n'est configuré. L'administrateur doit en ajouter.</p>
                            )}
                        </div>
                        <Separator />
                        <div>
                            <Label>Moyen de paiement</Label>
                            {loadingPaymentMethods ? (
                                <div className="flex items-center justify-center pt-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : paymentMethods.length > 0 ? (
                                <RadioGroup 
                                    value={selectedPaymentMethod} 
                                    onValueChange={setSelectedPaymentMethod}
                                    className="mt-2 space-y-2"
                                >
                                {paymentMethods.map(method => (
                                    <label key={method.id} htmlFor={method.id} className={cn("flex flex-col p-4 rounded-lg border cursor-pointer transition-colors", selectedPaymentMethod === method.id ? "bg-primary/10 border-primary" : "hover:bg-accent/50")}>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value={method.id} id={method.id} />
                                            <div className="flex flex-col">
                                                <Label htmlFor={method.id} className="font-semibold cursor-pointer">{method.name}</Label>
                                                {method.description && (
                                                    <p className="text-sm text-muted-foreground">{method.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                                </RadioGroup>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">Aucun moyen de paiement n'est configuré. L'administrateur doit en ajouter.</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            type="submit" 
                            size="lg"
                            className="w-full" 
                            disabled={cart.length === 0 || loadingPaymentMethods || paymentMethods.length === 0 || loadingShippingMethods || shippingMethods.length === 0 || isPlacingOrder}
                        >
                            {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Payer {total.toFixed(2)} FCFA
                        </Button>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

