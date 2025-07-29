'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock: Filter orders for a specific user. In a real app, this would be a real API call.
const userOrders = orders.filter(order => order.customerName === 'Jane Doe' || order.customerName === 'Michael Brown');

export default function OrdersPage() {
    return (
        <div className="bg-muted/40 min-h-[calc(100vh-12rem)] py-16">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/account">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">My Orders</CardTitle>
                        <CardDescription>Here's a list of your past and present orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                        <TableCell>${order.total.toFixed(2)}</TableCell>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
