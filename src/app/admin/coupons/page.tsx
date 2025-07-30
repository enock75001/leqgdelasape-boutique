
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
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState<Date>();

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "coupons"), orderBy("expiresAt", "desc"));
        const querySnapshot = await getDocs(q);
        const couponsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            ...data,
            expiresAt: (data.expiresAt as Timestamp).toDate().toISOString().split('T')[0],
            } as Coupon;
        });
        setCoupons(couponsData);
    } catch (error) {
        console.error("Error fetching coupons:", error);
        toast({ title: "Error", description: "Could not load coupons.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!newCouponCode || !newCouponDiscount || !newCouponExpiry) {
        toast({
            title: "Error",
            description: "Please fill out all fields.",
            variant: "destructive"
        });
        return;
    }

    const discountValue = parseFloat(newCouponDiscount);
    if (isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
        toast({ title: "Error", description: "Please enter a valid discount percentage (1-100).", variant: "destructive" });
        return;
    }

    try {
        const newCouponData = {
            code: newCouponCode.toUpperCase(),
            discount: discountValue,
            expiresAt: Timestamp.fromDate(newCouponExpiry),
        };
        await addDoc(collection(db, "coupons"), newCouponData);
        
        toast({
            title: "Coupon Added",
            description: `Coupon ${newCouponData.code} has been successfully added.`,
        });

        fetchCoupons(); // Refetch to get the new list with the ID
        setIsDialogOpen(false);
        setNewCouponCode('');
        setNewCouponDiscount('');
        setNewCouponExpiry(undefined);

    } catch (error) {
        console.error("Error adding coupon: ", error);
        toast({
            title: "Error",
            description: "Could not add the coupon. Please try again.",
            variant: "destructive",
        });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
        await deleteDoc(doc(db, "coupons", couponId));
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast({
            title: "Coupon Deleted",
            description: "The coupon has been successfully deleted.",
        });
    } catch (error) {
        console.error("Error deleting coupon: ", error);
        toast({
            title: "Error",
            description: "Could not delete the coupon. Please try again.",
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
                    <Input id="code" name="code" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} placeholder="E.g., SUMMER25" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input id="discount" name="discount" type="number" value={newCouponDiscount} onChange={(e) => setNewCouponDiscount(e.target.value)} placeholder="E.g., 25" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expiration Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !newCouponExpiry && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newCouponExpiry ? format(newCouponExpiry, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={newCouponExpiry}
                            onSelect={setNewCouponExpiry}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.discount}%</TableCell>
                  <TableCell>{new Date(coupon.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
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
