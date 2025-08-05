
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Promotion } from '@/lib/mock-data';
import Image from 'next/image';

export default function AdminCarouselPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "promotions"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Promotion));
        setPromotions(data);
    } catch (error) {
        console.error("Error fetching promotions: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les promotions.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSavePromotion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string;
    const image = formData.get('image') as string;
    const hint = formData.get('hint') as string;
    
    if (!title.trim() || !description.trim() || !image.trim()) {
        toast({ title: "Erreur", description: "Le titre, la description et l'URL de l'image sont requis.", variant: "destructive" });
        return;
    }
    
    const promotionData = {
        title,
        description,
        link: link || '',
        image,
        hint: hint || '',
        enabled: editingPromotion ? editingPromotion.enabled : true,
    };

    try {
        if (editingPromotion) {
            const promoRef = doc(db, "promotions", editingPromotion.id);
            await setDoc(promoRef, promotionData, { merge: true });
            toast({ title: "Succès", description: `Promotion mise à jour.` });
        } else {
            await addDoc(collection(db, "promotions"), promotionData);
            toast({ title: "Succès", description: `Promotion ajoutée.` });
        }
        fetchPromotions();
        closeDialog();
    } catch (error) {
        console.error("Error saving promotion: ", error);
        toast({ title: "Erreur", description: "Impossible d'enregistrer la promotion.", variant: "destructive" });
    }
  };
  
  const openDialog = (promotion: Promotion | null = null) => {
    setEditingPromotion(promotion);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setEditingPromotion(null);
    setIsDialogOpen(false);
  }

  const toggleEnabled = async (promotion: Promotion) => {
    try {
        const promoRef = doc(db, "promotions", promotion.id);
        await updateDoc(promoRef, { enabled: !promotion.enabled });
        setPromotions(prev => 
            prev.map(p => p.id === promotion.id ? { ...p, enabled: !p.enabled } : p)
        );
        toast({ title: "Statut mis à jour", description: `La promotion a été ${!promotion.enabled ? 'activée' : 'désactivée'}.` });
    } catch (error) {
        console.error("Error updating promotion: ", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
     if(confirm("Êtes-vous sûr de vouloir supprimer cette promotion ?")) {
        try {
            await deleteDoc(doc(db, "promotions", promotionId));
            setPromotions(prev => prev.filter(p => p.id !== promotionId));
            toast({ title: "Succès", description: "La promotion a été supprimée." });
        } catch (error) {
            console.error("Error deleting promotion: ", error);
            toast({ title: "Erreur", description: "Impossible de supprimer la promotion.", variant: "destructive" });
        }
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Carrousel de la Page d'Accueil</CardTitle>
          <CardDescription>Gérez les diapositives promotionnelles du carrousel.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) closeDialog() }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une Diapositive
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSavePromotion}>
              <DialogHeader>
                <DialogTitle>{editingPromotion ? 'Modifier' : 'Nouvelle'} Diapositive</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" defaultValue={editingPromotion?.title} placeholder="Ex: Collection Automne-Hiver" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingPromotion?.description} placeholder="Ex: Découvrez nos nouvelles pièces..." required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="image">URL de l'image</Label>
                    <Input id="image" name="image" defaultValue={editingPromotion?.image} placeholder="https://placehold.co/1200x600.png" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="hint">Indice AI pour l'image (max 2 mots)</Label>
                    <Input id="hint" name="hint" defaultValue={editingPromotion?.hint} placeholder="Ex: autumn fashion" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="link">Lien (Optionnel)</Label>
                    <Input id="link" name="link" defaultValue={editingPromotion?.link} placeholder="Ex: /products/new-collection" />
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
                <TableHead>Image</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                    <TableCell>
                        <Image src={promo.image} alt={promo.title} width={80} height={40} className="rounded-md object-cover" />
                    </TableCell>
                  <TableCell className="font-medium">{promo.title}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                            id={`switch-${promo.id}`}
                            checked={promo.enabled}
                            onCheckedChange={() => toggleEnabled(promo)}
                        />
                        <Label htmlFor={`switch-${promo.id}`}>{promo.enabled ? 'Activé' : 'Désactivé'}</Label>
                      </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(promo)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePromotion(promo.id)}>Supprimer</Button>
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
