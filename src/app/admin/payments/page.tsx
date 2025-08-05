
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
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPaymentsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

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
        toast({ title: "Erreur", description: "Impossible de charger les méthodes de paiement.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleSaveMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (!name.trim()) {
        toast({ title: "Erreur", description: "Le nom ne peut pas être vide.", variant: "destructive" });
        return;
    }
    
    const methodData = {
        name,
        description,
        enabled: editingMethod ? editingMethod.enabled : true,
    };

    try {
        if (editingMethod) {
            const methodRef = doc(db, "paymentMethods", editingMethod.id);
            await setDoc(methodRef, methodData, { merge: true });
            toast({ title: "Succès", description: `"${name}" a été mis à jour.` });
        } else {
            await addDoc(collection(db, "paymentMethods"), methodData);
            toast({ title: "Succès", description: `"${name}" a été ajouté.` });
        }
        fetchPaymentMethods();
        closeDialog();
    } catch (error) {
        console.error("Error saving payment method: ", error);
        toast({ title: "Erreur", description: "Impossible d'enregistrer la méthode de paiement.", variant: "destructive" });
    }
  };
  
  const openDialog = (method: PaymentMethod | null = null) => {
    setEditingMethod(method);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setEditingMethod(null);
    setIsDialogOpen(false);
  }

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
     if(confirm("Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?")) {
        try {
            await deleteDoc(doc(db, "paymentMethods", methodId));
            setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
            toast({ title: "Succès", description: "La méthode de paiement a été supprimée." });
        } catch (error) {
            console.error("Error deleting payment method: ", error);
            toast({ title: "Erreur", description: "Impossible de supprimer la méthode de paiement.", variant: "destructive" });
        }
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
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une méthode
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={closeDialog}>
            <form onSubmit={handleSaveMethod}>
              <DialogHeader>
                <DialogTitle>{editingMethod ? 'Modifier la méthode' : 'Nouvelle Méthode'} de Paiement</DialogTitle>
                <DialogDescription>
                  {editingMethod ? 'Modifiez les détails' : 'Entrez les détails de la nouvelle méthode'} de paiement.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" name="name" defaultValue={editingMethod?.name} placeholder="Ex: Paiement à la livraison" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description (Optionnel)</Label>
                    <Textarea id="description" name="description" defaultValue={editingMethod?.description} placeholder="Ex: Payez en espèces au moment de la livraison." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
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
                <TableHead className="w-[30%]">Nom</TableHead>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{method.description}</TableCell>
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
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(method)}>Modifier</Button>
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
