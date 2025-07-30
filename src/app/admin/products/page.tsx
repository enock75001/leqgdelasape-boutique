
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    setProducts(productsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productData: Omit<Product, 'id'> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : undefined,
      imageUrl: imagePreview || editingProduct?.imageUrl || 'https://placehold.co/600x600.png',
      stock: parseInt(formData.get('stock') as string, 10),
      category: formData.get('category') as string,
    };

    try {
      if (editingProduct) {
        const docRef = doc(db, "products", editingProduct.id);
        await setDoc(docRef, productData);
        toast({
            title: "Produit mis à jour",
            description: `${productData.name} a été mis à jour avec succès.`,
        });
      } else {
        await addDoc(collection(db, "products"), productData);
        toast({
            title: "Produit ajouté",
            description: `${productData.name} a été ajouté avec succès.`,
        });
      }
      fetchProducts();
      closeDialog();
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification du produit: ", error);
      toast({
          title: "Erreur",
          description: "Impossible de sauvegarder le produit. Veuillez réessayer.",
          variant: "destructive",
      });
    }
  };
  
  const openDialog = (product: Product | null = null) => {
      setEditingProduct(product);
      if (product && product.imageUrl) {
        setImagePreview(product.imageUrl);
      } else {
        setImagePreview(null);
      }
      setIsDialogOpen(true);
  }

  const closeDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setIsDialogOpen(false);
  }

  const handleDeleteProduct = async (productId: string) => {
      if(confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
          try {
              await deleteDoc(doc(db, "products", productId));
              toast({
                  title: "Produit supprimé",
                  description: "Le produit a été supprimé avec succès.",
              });
              fetchProducts();
          } catch (error) {
              console.error("Erreur lors de la suppression du produit: ", error);
              toast({
                  title: "Erreur",
                  description: "Impossible de supprimer le produit.",
                  variant: "destructive",
              });
          }
      }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Produits</CardTitle>
          <CardDescription>Gérez vos produits ici. Les données sont stockées dans Firestore.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmitProduct}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</DialogTitle>
                <DialogDescription>Remplissez les détails du produit.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={editingProduct?.description} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="originalPrice">Prix barré (Optionnel)</Label>
                            <Input id="originalPrice" name="originalPrice" type="number" step="0.01" defaultValue={editingProduct?.originalPrice} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Select name="category" defaultValue={editingProduct?.category} required>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Sélectionnez une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Eau de source">Eau de source</SelectItem>
                                    <SelectItem value="Eau pétillante">Eau pétillante</SelectItem>
                                    <SelectItem value="Eau améliorée">Eau améliorée</SelectItem>
                                    <SelectItem value="Eau aromatisée">Eau aromatisée</SelectItem>
                                    <SelectItem value="Grand format">Grand format</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="product-image">Image du produit</Label>
                    <Input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-2 h-48 flex items-center justify-center">
                        {imagePreview ? (
                            <div className="relative w-full h-full">
                                <Image src={imagePreview} alt="Aperçu de l'image" layout="fill" objectFit="contain" />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Aperçu de l'image</p>
                        )}
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                <Button type="submit">Enregistrer le produit</Button>
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
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                    {product.originalPrice && (
                        <span className="line-through text-muted-foreground mr-2">${product.originalPrice.toFixed(2)}</span>
                    )}
                    ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(product)}>Modifier</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>Supprimer</Button>
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
