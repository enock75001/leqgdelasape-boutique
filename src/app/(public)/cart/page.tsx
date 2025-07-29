
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
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 5.0;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount + shipping;

  const handleApplyCoupon = () => {
    if(couponCode.toUpperCase() === 'BLEU10') {
        setDiscount(0.10); // 10% discount
        toast({
            title: "Code appliqué",
            description: "Vous bénéficiez de 10% de réduction sur votre commande.",
        })
    } else {
        setDiscount(0);
        toast({
            title: "Code invalide",
            description: "Le code de réduction que vous avez saisi n'est pas valide.",
            variant: "destructive"
        })
    }
  }

  const handlePlaceOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cart.length === 0) {
        toast({
            title: "Votre panier est vide",
            description: "Veuillez ajouter des produits à votre panier avant de passer une commande.",
            variant: "destructive"
        });
        return;
    }
    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    
    // Notify admin
    addNotification({
        recipient: 'admin',
        message: `Nouvelle commande ${orderId} reçue pour ${total.toFixed(2)} $.`,
    });

    // Notify client if logged in
    if(user) {
        addNotification({
            recipient: 'client',
            userEmail: user.email,
            message: `Votre commande ${orderId} a été passée avec succès.`,
        });
    }

    toast({
      title: 'Commande passée !',
      description: 'Merci pour votre achat. Nous la traiterons sous peu.',
    });
    clearCart();
    setDiscount(0);
    setCouponCode('');
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
            <Link href="/products">Commencer les achats</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.product.id} className="flex items-center p-4">
                <div className="relative h-24 w-24 rounded-md overflow-hidden mr-4">
                  <Image src={item.product.imageUrl} alt={item.product.name} layout="fill" objectFit="cover" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="ml-4">
                    <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-4 text-red-500 hover:text-red-700" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Récapitulatif de la commande</CardTitle>
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
                        <Button onClick={handleApplyCoupon}>Appliquer</Button>
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Réduction ({discount * 100}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de port</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                 <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Finaliser la commande</CardTitle>
                </CardHeader>
                <form onSubmit={handlePlaceOrder}>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" type="text" placeholder="John Doe" required />
                        </div>
                        <div>
                            <Label htmlFor="address">Adresse de livraison</Label>
                            <Input id="address" type="text" placeholder="123 Water St" required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Passer la commande</Button>
                    </CardFooter>
                </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
