
'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "@/lib/mock-data";
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "orders"), orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(allOrders);
        } catch (error) {
            console.error("Error fetching orders: ", error);
            // Handle toast notification for error
        } finally {
            setIsLoading(false);
        }
    };

    fetchOrders();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>View and manage customer orders from Firestore.</CardDescription>
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.total.toFixed(2)} FCFA</TableCell>
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
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
