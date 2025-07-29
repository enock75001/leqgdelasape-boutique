'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const { toast } = useToast();
    
    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Address Saved", description: "Your shipping address has been updated." });
    }

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Payment Method Saved", description: "Your payment method has been updated." });
    }

    return (
        <div className="bg-muted/40 min-h-[calc(100vh-12rem)] py-16">
            <div className="container mx-auto max-w-2xl px-4">
                 <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/account">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Settings</CardTitle>
                            <CardDescription>Manage your account settings, addresses, and payment methods.</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                            <CardDescription>Your primary shipping address.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddressSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address-1">Address Line 1</Label>
                                    <Input id="address-1" placeholder="123 Water St" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input id="city" placeholder="Hydration City" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State / Province</Label>
                                        <Input id="state" placeholder="Aqua" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">Zip / Postal Code</Label>
                                        <Input id="zip" placeholder="12345" />
                                    </div>
                                </div>
                                <Button type="submit">Save Address</Button>
                            </form>
                        </CardContent>
                    </Card>
                    
                    <Card>
                         <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>Your primary payment method.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="card-number">Card Number</Label>
                                    <Input id="card-number" placeholder="**** **** **** 1234" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="expiry">Expiry Date</Label>
                                        <Input id="expiry" placeholder="MM / YY" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvc">CVC</Label>
                                        <Input id="cvc" placeholder="123" />
                                    </div>
                                </div>
                                <Button type="submit">Save Payment Method</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
