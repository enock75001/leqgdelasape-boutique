
'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Warehouse } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, orderBy, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Category, Product } from '@/lib/mock-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

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
            const parent = categoryMap.get(cat.parentId)!;
            // Ensure subcategories array exists
            if (!parent.subcategories) {
                parent.subcategories = [];
            }
            parent.subcategories.push(categoryMap.get(cat.id)!);
        } else {
            rootCategories.push(categoryMap.get(cat.id)!);
        }
    });

    return rootCategories;
};


export default function ManagerCategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [productsForStockUpdate, setProductsForStockUpdate] = useState<Product[]>([]);
  const [categoryForStockUpdate, setCategoryForStockUpdate] = useState<Category | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [bulkStockUpdates, setBulkStockUpdates] = useState<Record<string, Record<string, number>>>({});


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
    let parentId = formData.get('parentId') as string;
    
    if (!name.trim()) {
        toast({ title: "Erreur", description: "Le nom de la catégorie est requis.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const categoryData = { 
        name,
        parentId: parentId === 'none' ? null : parentId,
        isVisible: editingCategory ? editingCategory.isVisible ?? true : true,
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
  
  const toggleVisibility = async (category: Category) => {
    const newVisibility = !(category.isVisible ?? true);
    try {
        const categoryRef = doc(db, "categories", category.id);
        await updateDoc(categoryRef, { isVisible: newVisibility });
        
        const updatedCategories = allCategories.map(c => 
            c.id === category.id ? { ...c, isVisible: newVisibility } : c
        );
        setAllCategories(updatedCategories);
        setCategoryTree(buildCategoryTree(updatedCategories));

        toast({ title: "Visibilité mise à jour" });
    } catch (error) {
        console.error("Error updating visibility:", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour la visibilité.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
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
  
  const openStockUpdateDialog = async (category: Category) => {
    setCategoryForStockUpdate(category);
    setIsStockDialogOpen(true);
    setIsLoadingStock(true);
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('categories', 'array-contains', category.name)
      );
      const querySnapshot = await getDocs(productsQuery);
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProductsForStockUpdate(productsData);
    } catch (error) {
      console.error(`Error fetching products for category ${category.name}:`, error);
      toast({ title: "Erreur", description: "Impossible de charger les produits de cette catégorie.", variant: "destructive" });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleStockInputChange = (productId: string, size: string, value: string) => {
    const stock = parseInt(value, 10);
    setBulkStockUpdates(prev => ({
        ...prev,
        [productId]: {
            ...prev[productId],
            [size]: isNaN(stock) ? 0 : stock,
        }
    }));
  };

  const handleBulkStockUpdate = async () => {
    if (Object.keys(bulkStockUpdates).length === 0) {
        toast({ title: "Aucune modification", description: "Veuillez modifier au moins un stock.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        for (const productId in bulkStockUpdates) {
            const productRef = doc(db, "products", productId);
            const product = productsForStockUpdate.find(p => p.id === productId);
            if (!product) continue;

            const newVariants = product.variants.map(variant => {
                if (bulkStockUpdates[productId] && bulkStockUpdates[productId][variant.size] !== undefined) {
                    return { ...variant, stock: bulkStockUpdates[productId][variant.size] };
                }
                return variant;
            });
            batch.update(productRef, { variants: newVariants });
        }
        await batch.commit();
        toast({ title: "Stock mis à jour", description: `Le stock pour la catégorie ${categoryForStockUpdate?.name} a été mis à jour.` });
        setIsStockDialogOpen(false);
        setBulkStockUpdates({});
    } catch (error) {
        console.error("Error updating bulk stock:", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le stock.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
           <TableCell>
              <Switch
                  checked={category.isVisible ?? true}
                  onCheckedChange={() => toggleVisibility(category)}
              />
          </TableCell>
          <TableCell className="text-right space-x-2">
            <Button variant="outline" size="sm" onClick={() => openStockUpdateDialog(category)}>
              <Warehouse className="h-4 w-4 mr-2" /> Gérer le stock
            </Button>
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
    <>
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
                      <Select name="parentId" defaultValue={editingCategory?.parentId || 'none'} disabled={isSubmitting}>
                          <SelectTrigger id="parentId">
                              <SelectValue placeholder="Aucune (Catégorie Principale)" />
                          </SelectTrigger>
                          <SelectContent>
                               <SelectItem value="none">Aucune (Catégorie Principale)</SelectItem>
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
                  <TableHead>Visible</TableHead>
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
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Gérer le stock pour "{categoryForStockUpdate?.name}"</DialogTitle>
                  <DialogDescription>
                      Mettez à jour le stock pour tous les produits de cette catégorie.
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] my-4 pr-6">
                  {isLoadingStock ? (
                      <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : productsForStockUpdate.length > 0 ? (
                      <div className="space-y-4">
                          {productsForStockUpdate.map(product => (
                              <div key={product.id} className="p-4 border rounded-lg">
                                  <h4 className="font-semibold">{product.name}</h4>
                                  <div className="mt-2 space-y-2">
                                      {product.variants.map((variant, index) => (
                                          <div key={index} className="flex items-center gap-4">
                                              <Label className="w-1/3">{variant.size}</Label>
                                              <Input 
                                                  type="number" 
                                                  className="w-2/3"
                                                  placeholder={`Actuel: ${variant.stock}`}
                                                  defaultValue={(bulkStockUpdates[product.id] && bulkStockUpdates[product.id][variant.size]) ?? variant.stock}
                                                  onChange={(e) => handleStockInputChange(product.id, variant.size, e.target.value)}
                                              />
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-muted-foreground py-10">Aucun produit trouvé dans cette catégorie.</p>
                  )}
              </ScrollArea>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleBulkStockUpdate} disabled={isSubmitting || isLoadingStock}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer les stocks
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
