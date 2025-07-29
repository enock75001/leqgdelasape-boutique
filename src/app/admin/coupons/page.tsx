
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coupon } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const couponsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiresAt: (data.expiresAt as Timestamp).toDate().toISOString().split('T')[0],
        } as Coupon;
      });
      setCoupons(couponsData);
      setIsLoading(false);
    };

    fetchCoupons();
  }, []);

  const handleAddCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const code = (formData.get('code') as string).toUpperCase();
    const discount = parseFloat(formData.get('discount') as string);
    const expiresAt = date;

    if (!code || !discount || !expiresAt) {
        toast({
            title: "Erreur",
            description: "Veuillez remplir tous les champs.",
            variant: "destructive"
        });
        return;
    }

    try {
        const newCouponRef = await addDoc(collection(db, "coupons"), {
            code,
            discount,
            expiresAt: Timestamp.fromDate(expiresAt),
        });
        const newCoupon: Coupon = {
            id: newCouponRef.id,
            code,
            discount,
            expiresAt: format(expiresAt, "yyyy-MM-dd"),
        };
        setCoupons(prev => [...prev, newCoupon]);
        setIsDialogOpen(false);
        setDate(undefined);
        toast({
            title: "Coupon ajouté",
            description: `Le coupon ${newCoupon.code} a été ajouté avec succès.`,
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout du coupon: ", error);
        toast({
            title: "Erreur",
            description: "Impossible d'ajouter le coupon. Veuillez réessayer.",
            variant: "destructive",
        });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
        await deleteDoc(doc(db, "coupons", couponId));
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast({
            title: "Coupon supprimé",
            description: "Le coupon a été supprimé avec succès.",
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du coupon: ", error);
        toast({
            title: "Erreur",
            description: "Impossible de supprimer le coupon. Veuillez réessayer.",
            variant: "destructive",
        });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Discount Coupons</CardTitle>
          <CardDescription>Manage your promotional codes stored in Firestore.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddCoupon}>
              <DialogHeader>
                <DialogTitle>Add New Coupon</DialogTitle>
                <DialogDescription>Fill in the details for the new coupon.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input id="code" name="code" placeholder="E.g., SUMMER25" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input id="discount" name="discount" type="number" placeholder="E.g., 25" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expiration Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Coupon</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.discount}%</TableCell>
                  <TableCell>{new Date(coupon.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>Delete</Button>
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
