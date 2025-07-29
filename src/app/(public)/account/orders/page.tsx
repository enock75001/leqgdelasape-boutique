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
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/account">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-headline font-bold">Mes Commandes</h1>
                    <p className="text-muted-foreground">Voici la liste de vos commandes passées et présentes.</p>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Commande</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.date}</TableCell>
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
                                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
