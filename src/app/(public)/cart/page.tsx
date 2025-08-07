
'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2, MapPin } from 'lucide-react';
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
import { addContact } from '@/ai/flows/add-contact-flow';
import { sendAdminEmail } from '@/ai/flows/send-admin-email-flow';


// Modèles d'e-mails
const getOrderConfirmationEmailHtml = (order: Omit<Order, 'id'>, orderId: string) => {
    const itemsHtml = order.items.map(item => `
        <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 0;">
                <img src="${item.imageUrl || 'https://placehold.co/64x64.png'}" alt="${item.productName}" width="48" style="border-radius: 4px; margin-right: 10px; vertical-align: middle;">
                <span style="font-size: 14px;">${item.productName} ${item.variant ? `(${item.variant.size}, ${item.variant.color})` : ''} (x${item.quantity})</span>
            </td>
            <td style="text-align: right; padding: 10px 0;">${Math.round(item.price * item.quantity)} FCFA</td>
        </tr>
    `).join('');

    return `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #ffffff; padding: 20px;">
                                <img src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="Logo" width="40" height="40" style="border-radius: 50%; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                                <h1 style="display: inline-block; vertical-align: middle; margin: 0; font-size: 24px; font-weight: bold; color: #333;">LE QG DE LA SAPE</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px;">Merci pour votre commande, ${order.customerName} !</h2>
                                <p>Votre commande <strong>#${orderId.slice(-6)}</strong> a bien été reçue et est en cours de traitement.</p>
                                <p style="margin-bottom: 25px;">Voici un récapitulatif de votre achat :</p>
                                
                                <!-- Items Table -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    ${itemsHtml}
                                </table>
                                
                                <!-- Total -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 2px solid #eaeaea;">
                                    <tr>
                                        <td style="padding: 15px 0 5px;">Sous-total</td>
                                        <td style="padding: 15px 0 5px; text-align: right;">${Math.round(order.total - order.shippingCost)} FCFA</td>
                                    </tr>
                                     <tr>
                                        <td style="padding: 5px 0;">Frais de livraison</td>
                                        <td style="padding: 5px 0; text-align: right;">${Math.round(order.shippingCost)} FCFA</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 15px 0; font-size: 18px; font-weight: bold;">Total</td>
                                        <td style="padding: 15px 0; font-size: 18px; font-weight: bold; text-align: right;">${Math.round(order.total)} FCFA</td>
                                    </tr>
                                </table>

                                <!-- Shipping Info -->
                                <h3 style="font-size: 16px; border-top: 1px solid #eaeaea; padding-top: 20px; margin-top: 20px;">Adresse de livraison</h3>
                                <p>${order.shippingAddress}</p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                                <p style="margin: 0;">Vous recevrez un autre e-mail une fois votre commande expédiée.</p>
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

const getAdminNotificationEmailHtml = (order: Omit<Order, 'id'>, orderId: string) => {
    const itemsHtml = order.items.map(item => `
        <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 0;">
                <img src="${item.imageUrl || 'https://placehold.co/64x64.png'}" alt="${item.productName}" width="48" style="border-radius: 4px; margin-right: 10px; vertical-align: middle;">
                <span style="font-size: 14px;">${item.productName} ${item.variant ? `(${item.variant.size}, ${item.variant.color})` : ''}</span>
            </td>
            <td style="text-align: center; padding: 10px 0;">x ${item.quantity}</td>
            <td style="text-align: right; padding: 10px 0;">${Math.round(item.price * item.quantity)} FCFA</td>
        </tr>
    `).join('');

    return `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                           <td align="center" style="background-color: #ffffff; padding: 20px;">
                                <img src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="Logo" width="40" height="40" style="border-radius: 50%; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                                <h1 style="display: inline-block; vertical-align: middle; margin: 0; font-size: 24px; font-weight: bold; color: #333;">LE QG DE LA SAPE</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px;">Nouvelle Commande Reçue !</h2>
                                <p style="margin-bottom: 25px;">Une nouvelle commande vient d'être passée sur votre boutique.</p>
                                
                                <!-- Order Details -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    <tr>
                                        <td style="padding-bottom: 10px;"><strong>Commande :</strong> #${orderId.slice(-6)}</td>
                                        <td style="padding-bottom: 10px; text-align: right;"><strong>Date :</strong> ${new Date(order.date).toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding-bottom: 15px;">
                                            <strong>Client :</strong> ${order.customerName} (${order.customerEmail || 'Non fourni'})<br/>
                                            <strong>Téléphone :</strong> ${order.customerPhone}<br/>
                                            <strong>Adresse :</strong> ${order.shippingAddress}
                                        </td>
                                    </tr>
                                </table>

                                <!-- Items Table -->
                                <h3 style="font-size: 16px; border-top: 1px solid #eaeaea; padding-top: 20px; margin-top: 20px;">Récapitulatif des articles</h3>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    ${itemsHtml}
                                </table>
                                
                                <!-- Total -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 2px solid #eaeaea;">
                                    <tr>
                                        <td style="padding: 15px 0; font-size: 18px; font-weight: bold;">Total de la commande</td>
                                        <td style="padding: 15px 0; font-size: 18px; font-weight: bold; text-align: right;">${Math.round(order.total)} FCFA</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                                <p style="margin: 0;">Ceci est une notification automatique. Veuillez consulter votre tableau de bord pour plus de détails.</p>
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


export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(true);
  
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState('');


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
            toast({ title: "Erreur", description: "Impossible de charger les méthodes de paiement.", variant: "destructive" });
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
            toast({ title: "Erreur", description: "Impossible de charger les méthodes de livraison.", variant: "destructive" });
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
  
  const total = subtotal - discountAmount + shippingCost;
  
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
                // Fallback if reverse geocoding fails
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
            setDiscountAmount(0);
            toast({ title: "Code Invalide", description: "Ce code de réduction n'existe pas.", variant: "destructive" });
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const coupon = couponDoc.data() as Coupon;
        const expiresAt = (coupon.expiresAt as unknown as Timestamp).toDate();

        if (expiresAt < new Date()) {
            setDiscountAmount(0);
            toast({ title: "Code Expiré", description: "Ce code de réduction a expiré.", variant: "destructive" });
        } else {
            setDiscountAmount(coupon.discount);
            toast({ title: "Code Appliqué", description: `Vous bénéficiez de ${Math.round(coupon.discount)} FCFA de réduction.` });
        }
    } catch (error) {
        console.error("Error validating coupon:", error);
        setDiscountAmount(0);
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
    const customerPhone = formData.get('phone') as string;

    if (cart.length === 0) {
        toast({ title: "Votre panier est vide", description: "Veuillez ajouter des produits à votre panier.", variant: "destructive" });
        setIsPlacingOrder(false);
        return;
    }
    if (!selectedPaymentMethod || !selectedShippingMethod) {
        toast({ title: "Informations manquantes", description: "Veuillez sélectionner une méthode de livraison et de paiement.", variant: "destructive" });
        setIsPlacingOrder(false);
        return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const shippingMethodName = shippingMethods.find(s => s.id === selectedShippingMethod)?.name || 'N/A';
    const paymentMethodName = paymentMethods.find(p => p.id === selectedPaymentMethod)?.name || 'N/A';

    const orderData: Omit<Order, 'id'> = {
        userId: user?.uid || null,
        customerName,
        customerEmail,
        customerPhone,
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
            imageUrl: item.product.imageUrls?.[0] || 'https://placehold.co/100x100.png',
        })),
        shippingMethod: shippingMethodName,
        shippingCost,
        paymentMethod: paymentMethodName,
    };
    
    try {
        const orderDocRef = await addDoc(collection(db, "orders"), orderData);
        const finalOrderId = orderDocRef.id;

        // Try adding contact to Brevo only if email is provided
        if(customerEmail) {
            addContact({ email: customerEmail }).catch(brevoError => {
                console.warn("Échec de l'ajout du contact à Brevo, mais la commande a été passée :", brevoError);
            });

            // Send email to client with Brevo
            sendEmail({
                to: customerEmail,
                subject: 'Confirmation de votre commande LE QG DE LA SAPE',
                htmlContent: getOrderConfirmationEmailHtml(orderData, finalOrderId),
            }).then(result => {
                 if (!result.success) {
                    console.warn(`Échec de l'envoi de l'e-mail de confirmation à ${customerEmail}:`, result.message);
                    toast({ title: "Commande passée, mais...", description: `Nous n'avons pas pu envoyer l'e-mail de confirmation. Erreur: ${result.message}`, variant: "destructive"})
                }
            });
        }
        
        // Send email to admin with Resend
        sendAdminEmail({
            to: 'le.qg10delasape@gmail.com', 
            subject: `Nouvelle commande reçue : #${finalOrderId.slice(-6)}`,
            htmlContent: getAdminNotificationEmailHtml(orderData, finalOrderId),
        }).then(result => {
            if (!result.success) {
                console.warn(`Échec de l'envoi de l'e-mail de notification à l'admin:`, result.message);
            }
        });

        // Notifier l'administrateur dans l'interface
        addNotification({
            recipient: 'admin',
            message: `Nouvelle commande #${finalOrderId.slice(-6)} reçue pour ${Math.round(total)} FCFA.`,
        });

        toast({
          title: 'Commande passée !',
          description: 'Merci pour votre achat. Nous la traiterons sous peu.',
        });
        clearCart();
        setDiscountAmount(0);
        setCouponCode('');
        
        if (user) {
            addNotification({
                recipient: 'client',
                userEmail: user.email,
                message: `Votre commande #${finalOrderId.slice(-6)} a été passée avec succès.`,
            });
            router.push('/account/orders');
        } else {
            router.push(`/order-confirmation/${finalOrderId}`);
        }

    } catch (error) {
        console.error("Erreur lors de la passation de la commande : ", error);
        toast({ title: "Erreur", description: "Impossible de passer la commande. Une erreur de base de données s'est produite.", variant: "destructive" });
    } finally {
        setIsPlacingOrder(false);
    }
  };
  
  if (isPlacingOrder) {
    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <h1 className="text-2xl font-headline font-bold">Votre commande est en cours de traitement...</h1>
            <p className="text-muted-foreground mt-2">Veuillez ne pas fermer ou rafraîchir cette page.</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Votre Panier</h1>
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
            <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Articles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                             <TableBody>
                                {cart.map(item => (
                                <TableRow key={item.product.id + JSON.stringify(item.variant)} className="border-t">
                                    <TableCell className="p-2 md:p-4">
                                        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-md overflow-hidden">
                                            <Image src={item.product.imageUrls?.[0] || 'https://placehold.co/100x100.png'} alt={item.product.name} fill objectFit="cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <h3 className="font-semibold text-sm md:text-base">{item.product.name}</h3>
                                        {item.variant && (
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                            {item.variant.size}, {item.variant.color}
                                            </p>
                                        )}
                                         <p className="text-sm text-muted-foreground md:hidden">{Math.round(item.product.price)} FCFA</p>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{Math.round(item.product.price)} FCFA</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 md:gap-2">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}>
                                                <MinusCircle className="h-5 w-5" />
                                            </Button>
                                            <span className="w-8 text-center text-sm md:text-base">{item.quantity}</span>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}>
                                                <PlusCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-right text-sm md:text-base">{Math.round(item.product.price * item.quantity)} FCFA</TableCell>
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

                 <Card className="bg-primary/10 border-primary/20">
                    <CardHeader>
                         <CardTitle className="font-headline text-primary">Déjà client ?</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-primary/90">
                           <Link href="/login" className="font-bold underline">Connectez-vous</Link> pour récupérer vos adresses. Sinon, continuez simplement ci-dessous pour passer votre commande en un clic, sans inscription nécessaire.
                        </p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Informations de livraison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" name="name" type="text" placeholder="John Doe" defaultValue={user?.name || ''} required />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="address">Adresse de livraison</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                    Utiliser ma position
                                </Button>
                            </div>
                            <Input id="address" name="address" type="text" placeholder="Abidjan, Port-Bouët, Adjouffou" value={address} onChange={(e) => setAddress(e.target.value)} required />
                        </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="you@example.com" defaultValue={user?.email || ''} />
                                <p className="text-xs text-muted-foreground mt-1">Optionnel, mais recommandé pour le suivi de commande.</p>
                            </div>
                            <div>
                                <Label htmlFor="phone">Numéro de téléphone</Label>
                                <Input id="phone" name="phone" type="tel" placeholder="+225 0102030405" defaultValue={user?.phone || ''} required />
                            </div>
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
                                <span>{Math.round(subtotal)} FCFA</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Réduction</span>
                                    <span>-{Math.round(discountAmount)} FCFA</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Frais de livraison</span>
                                <span>{Math.round(shippingCost)} FCFA</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{Math.round(total)} FCFA</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Options de paiement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label>Méthode de livraison</Label>
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
                                      <span className="text-sm font-semibold">{Math.round(method.price)} FCFA</span>
                                    </label>
                                ))}
                                </RadioGroup>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-2">Aucune méthode de livraison n'est configurée. L'administrateur doit en ajouter.</p>
                            )}
                        </div>
                        <Separator />
                        <div>
                            <Label>Méthode de paiement</Label>
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
                                <p className="text-sm text-muted-foreground mt-2">Aucune méthode de paiement n'est configurée. L'administrateur doit en ajouter.</p>
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
                            Payer {Math.round(total)} FCFA
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
