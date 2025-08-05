
'use client';

import { Order } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { CardFooter } from '../ui/card';

interface OrderReceiptProps {
  order: Order;
  showDownloadButton?: boolean;
}

export function OrderReceipt({ order, showDownloadButton = false }: OrderReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-background text-foreground p-4 md:p-8 rounded-lg print:p-0" id="receipt">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
            <Store className="h-6 w-6" />
            LE QG DE LA SAPE
          </h1>
          <p className="text-muted-foreground">L'élégance a son quartier général.</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">Reçu de Commande</h2>
          <p className="text-sm text-muted-foreground">Commande #{order.id.slice(-6)}</p>
          <p className="text-sm text-muted-foreground">Date: {new Date(order.date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer and Shipping Info */}
      <div className="grid md:grid-cols-2 gap-6 my-6">
        <div>
          <h3 className="font-semibold mb-2">Client</h3>
          <p className="text-muted-foreground">
            {order.customerName}<br />
            {order.customerEmail}<br />
            {order.customerPhone}
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Adresse de livraison</h3>
          <p className="text-muted-foreground">{order.shippingAddress}</p>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Détails de la commande</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Produit</TableHead>
              <TableHead>Qté</TableHead>
              <TableHead className="text-right">Prix Unitaire</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                        <Image 
                            src={item.imageUrl || 'https://placehold.co/100x100.png'} 
                            alt={item.productName} 
                            fill
                            objectFit="cover"
                        />
                      </div>
                      <div>
                        {item.productName}
                        {item.variant && (
                          <div className="text-xs text-muted-foreground">
                            {item.variant.size}, {item.variant.color}
                          </div>
                        )}
                      </div>
                  </div>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">{item.price.toFixed(2)} FCFA</TableCell>
                <TableCell className="text-right">{(item.price * item.quantity).toFixed(2)} FCFA</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator className="my-6" />

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison ({order.shippingMethod})</span>
            <span>{order.shippingCost.toFixed(2)} FCFA</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{order.total.toFixed(2)} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payé avec</span>
            <span>{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground space-y-1">
        <p>Merci pour votre achat !</p>
        <p>
          Pour toute question, contactez-nous à le.qg10delasape@gmail.com ou au +225 01 02 03 04 05
        </p>
      </div>
      
       {showDownloadButton && (
        <CardFooter className="mt-6 p-0 justify-end print:hidden">
            <Button variant="outline" onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4"/>
                Télécharger le reçu
            </Button>
        </CardFooter>
      )}
    </div>
  );
}
