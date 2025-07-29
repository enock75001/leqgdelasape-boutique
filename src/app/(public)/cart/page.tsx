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

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handlePlaceOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cart.length === 0) {
        toast({
            title: "Your cart is empty",
            description: "Please add products to your cart before placing an order.",
            variant: "destructive"
        });
        return;
    }
    toast({
      title: 'Order Placed!',
      description: 'Thank you for your purchase. We will process it shortly.',
    });
    clearCart();
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary">Your Cart</h1>
      </div>
      {cart.length === 0 ? (
        <div className="text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
          <p className="mt-4 text-xl text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
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
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>$5.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${(subtotal + 5).toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                 {/* This would typically be a separate page or modal */}
              </CardFooter>
            </Card>
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="font-headline">Checkout</CardTitle>
                </CardHeader>
                <form onSubmit={handlePlaceOrder}>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" type="text" placeholder="John Doe" required />
                        </div>
                        <div>
                            <Label htmlFor="address">Shipping Address</Label>
                            <Input id="address" type="text" placeholder="123 Water St" required />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Place Order</Button>
                    </CardFooter>
                </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
