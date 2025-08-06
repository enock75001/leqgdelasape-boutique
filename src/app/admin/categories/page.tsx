
'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { Category } from '@/lib/mock-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper to build the category tree
const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category & { subcategories: Category[] }>();
    const rootCategories: (Category & { subcategories: Category[] })[] = [];

    // Initialize map
    categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    // Build tree
    categories.forEach(cat => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            categoryMap.get(cat.parentId)!.subcategories.push(categoryMap.get(cat.id)!);
        } else {
            rootCategories.push(categoryMap.get(cat.id)!);
        }
    });

    return rootCategories;
};


export default function AdminCategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
        const q = query(collection(db, "categories"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Category));
        setAllCategories(data);
        setCategoryTree(buildCategoryTree(data));
    } catch (error) {
        console.error("Error fetching categories: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les catégories.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string;
    
    if (!name.trim()) {
        toast({ title: "Erreur", description: "Le nom de la catégorie est requis.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const categoryData = { 
        name,
        parentId: parentId || null
    };

    try {
        if (editingCategory) {
            const categoryRef = doc(db, "categories", editingCategory.id);
            await setDoc(categoryRef, categoryData, { merge: true });
            toast({ title: "Succès", description: `Catégorie mise à jour.` });
        } else {
            await addDoc(collection(db, "categories"), categoryData);
            toast({ title: "Succès", description: `Catégorie ajoutée.` });
        }
        fetchCategories();
        closeDialog();
    } catch (error) {
        console.error("Error saving category: ", error);
        toast({ title: "Erreur", description: "Impossible d'enregistrer la catégorie.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const openDialog = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(false);
  }

  const handleDeleteCategory = async (categoryId: string) => {
    // Check if the category has subcategories
    const hasChildren = allCategories.some(cat => cat.parentId === categoryId);
    if(hasChildren) {
        toast({ title: "Action impossible", description: "Veuillez d'abord supprimer ou déplacer les sous-catégories.", variant: "destructive" });
        return;
    }
    
    try {
        await deleteDoc(doc(db, "categories", categoryId));
        fetchCategories();
        toast({ title: "Succès", description: "La catégorie a été supprimée." });
    } catch (error) {
        console.error("Error deleting category: ", error);
        toast({ title: "Erreur", description: "Impossible de supprimer la catégorie. Assurez-vous qu'aucun produit ne l'utilise.", variant: "destructive" });
    }
  };
  
  const renderCategoryRows = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <Fragment key={category.id}>
        <TableRow>
          <TableCell className="font-medium" style={{ paddingLeft: `${level * 1.5}rem` }}>
             {level > 0 && <span className="mr-2 text-muted-foreground">└</span>}
            {category.name}
          </TableCell>
          <TableCell className="text-right space-x-2">
            <Button variant="outline" size="sm" onClick={() => openDialog(category)}>Modifier</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Supprimer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La catégorie <strong>{category.name}</strong> sera supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TableCell>
        </TableRow>
        {category.subcategories && category.subcategories.length > 0 && renderCategoryRows(category.subcategories, level + 1)}
      </Fragment>
    ));
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Catégories de Produits</CardTitle>
          <CardDescription>Gérez les catégories et sous-catégories de vos produits.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {if(isSubmitting) e.preventDefault()}} onEscapeKeyDown={closeDialog}>
            <form onSubmit={handleSaveCategory}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Modifier' : 'Nouvelle'} Catégorie</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nom de la catégorie</Label>
                    <Input id="name" name="name" defaultValue={editingCategory?.name} placeholder="Ex: T-shirts" required disabled={isSubmitting} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="parentId">Catégorie Parente (Optionnel)</Label>
                    <Select name="parentId" defaultValue={editingCategory?.parentId || ''} disabled={isSubmitting}>
                        <SelectTrigger id="parentId">
                            <SelectValue placeholder="Aucune (Catégorie Principale)" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="">Aucune (Catégorie Principale)</SelectItem>
                            {allCategories.filter(c => c.id !== editingCategory?.id).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                </Button>
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
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderCategoryRows(categoryTree)}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
