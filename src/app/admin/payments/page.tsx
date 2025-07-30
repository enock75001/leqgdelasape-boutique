
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentMethod } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';

export default function AdminPaymentsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [newMethodName, setNewMethodName] = useState('');

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "paymentMethods"));
        const methodsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PaymentMethod));
        setPaymentMethods(methodsData);
    } catch (error) {
        console.error("Error fetching payment methods: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les moyens de paiement.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAddMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMethodName.trim()) {
        toast({ title: "Erreur", description: "Le nom ne peut pas être vide.", variant: "destructive" });
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "paymentMethods"), {
            name: newMethodName,
            enabled: true,
        });
        setPaymentMethods(prev => [...prev, { id: docRef.id, name: newMethodName, enabled: true }]);
        setNewMethodName('');
        setIsDialogOpen(false);
        toast({ title: "Succès", description: `"${newMethodName}" a été ajouté.` });
    } catch (error) {
        console.error("Error adding payment method: ", error);
        toast({ title: "Erreur", description: "Impossible d'ajouter le moyen de paiement.", variant: "destructive" });
    }
  };

  const toggleEnabled = async (method: PaymentMethod) => {
    try {
        const methodRef = doc(db, "paymentMethods", method.id);
        await updateDoc(methodRef, { enabled: !method.enabled });
        setPaymentMethods(prev => 
            prev.map(m => m.id === method.id ? { ...m, enabled: !m.enabled } : m)
        );
        toast({ title: "Statut mis à jour", description: `${method.name} a été ${!method.enabled ? 'activé' : 'désactivé'}.` });
    } catch (error) {
        console.error("Error updating payment method: ", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    try {
        await deleteDoc(doc(db, "paymentMethods", methodId));
        setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
        toast({ title: "Succès", description: "Le moyen de paiement a été supprimé." });
    } catch (error) {
        console.error("Error deleting payment method: ", error);
        toast({ title: "Erreur", description: "Impossible de supprimer le moyen de paiement.", variant: "destructive" });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Moyens de Paiement</CardTitle>
          <CardDescription>Gérez les options de paiement disponibles pour les clients.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter un moyen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddMethod}>
              <DialogHeader>
                <DialogTitle>Nouveau Moyen de Paiement</DialogTitle>
                <DialogDescription>Entrez le nom du nouveau moyen de paiement.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} placeholder="Ex: Paiement à la livraison" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
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
                <TableHead className="w-[60%]">Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                            id={`switch-${method.id}`}
                            checked={method.enabled}
                            onCheckedChange={() => toggleEnabled(method)}
                        />
                        <Label htmlFor={`switch-${method.id}`}>{method.enabled ? 'Activé' : 'Désactivé'}</Label>
                      </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMethod(method.id)}>Supprimer</Button>
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

