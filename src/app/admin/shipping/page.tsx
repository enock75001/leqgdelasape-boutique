
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShippingMethod } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';

export default function AdminShippingPage() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodPrice, setNewMethodPrice] = useState('');

  const fetchShippingMethods = async () => {
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "shippingMethods"));
        const methodsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ShippingMethod));
        setShippingMethods(methodsData);
    } catch (error) {
        console.error("Error fetching shipping methods: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les méthodes de livraison.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingMethods();
  }, [toast]);

  const handleAddMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMethodName.trim() || !newMethodPrice) {
        toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
        return;
    }

    try {
        const price = parseFloat(newMethodPrice);
        if (isNaN(price)) {
             toast({ title: "Erreur", description: "Le prix est invalide.", variant: "destructive" });
             return;
        }

        const docRef = await addDoc(collection(db, "shippingMethods"), {
            name: newMethodName,
            price: price,
            enabled: true,
        });
        setShippingMethods(prev => [...prev, { id: docRef.id, name: newMethodName, price: price, enabled: true }]);
        setNewMethodName('');
        setNewMethodPrice('');
        setIsDialogOpen(false);
        toast({ title: "Succès", description: `"${newMethodName}" a été ajouté.` });
    } catch (error) {
        console.error("Error adding shipping method: ", error);
        toast({ title: "Erreur", description: "Impossible d'ajouter la méthode de livraison.", variant: "destructive" });
    }
  };

  const toggleEnabled = async (method: ShippingMethod) => {
    try {
        const methodRef = doc(db, "shippingMethods", method.id);
        await updateDoc(methodRef, { enabled: !method.enabled });
        setShippingMethods(prev => 
            prev.map(m => m.id === method.id ? { ...m, enabled: !m.enabled } : m)
        );
        toast({ title: "Statut mis à jour", description: `${method.name} a été ${!method.enabled ? 'activé' : 'désactivé'}.` });
    } catch (error) {
        console.error("Error updating shipping method: ", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    try {
        await deleteDoc(doc(db, "shippingMethods", methodId));
        setShippingMethods(prev => prev.filter(m => m.id !== methodId));
        toast({ title: "Succès", description: "La méthode de livraison a été supprimée." });
    } catch (error) {
        console.error("Error deleting shipping method: ", error);
        toast({ title: "Erreur", description: "Impossible de supprimer la méthode de livraison.", variant: "destructive" });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Moyens de Livraison</CardTitle>
          <CardDescription>Gérez les options de livraison disponibles pour les clients.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une option
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddMethod}>
              <DialogHeader>
                <DialogTitle>Nouvelle Méthode de Livraison</DialogTitle>
                <DialogDescription>Entrez les détails de la nouvelle option de livraison.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} placeholder="Ex: Livraison à domicile" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="price">Prix (FCFA)</Label>
                    <Input id="price" value={newMethodPrice} onChange={(e) => setNewMethodPrice(e.target.value)} type="number" placeholder="Ex: 1500" required />
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
                <TableHead className="w-[50%]">Nom</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shippingMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                   <TableCell>{Math.round(method.price)} FCFA</TableCell>
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
