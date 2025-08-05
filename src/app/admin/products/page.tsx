
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, Variant, Category } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, Trash2, Sparkles } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow';
import { Checkbox } from '@/components/ui/checkbox';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);

  const [variants, setVariants] = useState<Omit<Variant, 'id'>[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [createMultipleFromImages, setCreateMultipleFromImages] = useState(true);

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProductsAndCategories = async () => {
    setIsLoading(true);
    try {
        const productsQuery = query(collection(db, "products"), orderBy("name"));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(productsData);

        const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Category));
        setCategories(categoriesData);

    } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les produits ou les catégories.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleAddImageUrl = () => {
    if (imageUrlInput && !imageUrls.includes(imageUrlInput)) {
      setImageUrls(prev => [...prev, imageUrlInput]);
      setImageUrlInput('');
    }
  };

  const handleImageFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };
  
  const addVariant = () => {
    setVariants(prev => [...prev, { size: 'M', stock: 10 }]);
  };

  const updateVariant = (index: number, field: keyof Omit<Variant, 'id'>, value: string | number) => {
    setVariants(prev => {
        const newVariants = [...prev];
        const variantToUpdate = { ...newVariants[index] };
        
        if (field === 'stock') {
            const stockValue = typeof value === 'string' ? parseInt(value, 10) : value;
            variantToUpdate.stock = isNaN(stockValue) || stockValue < 0 ? 0 : stockValue;
        } else {
            (variantToUpdate as any)[field] = value;
        }
        
        newVariants[index] = variantToUpdate;
        return newVariants;
    });
};

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleGenerateProductInfo = async () => {
    if (imageFiles.length === 0 && imageUrls.length === 0) {
        toast({title: "Aucune image", description: "Veuillez ajouter une image pour générer une description.", variant: "destructive"});
        return;
    }
    
    setIsGeneratingInfo(true);
    try {
        let imageDataUrl;
        if (imageFiles.length > 0) {
            imageDataUrl = await fileToDataUrl(imageFiles[0]);
        } else {
            imageDataUrl = imageUrls[0];
        }
        
        const result = await generateProductDescription({ photoDataUri: imageDataUrl });

        if (result.error) {
            toast({title: "Erreur de génération", description: result.error, variant: "destructive"});
        } else {
            setName(result.title);
            setDescription(result.description);
            toast({title: "Informations générées", description: "Le titre et la description ont été générés par l'IA."});
        }

    } catch (error) {
        console.error("Error generating product info:", error);
        toast({title: "Erreur de génération", description: "Impossible de générer les informations.", variant: "destructive"});
    } finally {
        setIsGeneratingInfo(false);
    }
  }


  const handleSubmitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    
    let uploadedImageUrls = [...imageUrls];

    if (imageFiles.length > 0) {
      try {
        const uploadPromises = imageFiles.map(file => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          return uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
        });
        const newUrls = await Promise.all(uploadPromises);
        uploadedImageUrls.push(...newUrls);
      } catch (error) {
        console.error("Erreur lors de l'upload des images: ", error);
        toast({ title: "Erreur d'upload", description: "Impossible d'uploader les images. Veuillez réessayer.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
    }

    if(uploadedImageUrls.length === 0) {
        uploadedImageUrls.push('https://placehold.co/600x600.png');
    }

    const baseProductData: Omit<Product, 'id'> = {
      name: name,
      description: description,
      price: parseFloat(formData.get('price') as string),
      originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : undefined,
      imageUrls: [], // Will be set per product
      category: formData.get('category') as string,
      variants: variants,
      isNew: isNew,
    };

    try {
      if (editingProduct) {
        // --- UPDATE LOGIC ---
        const docRef = doc(db, "products", editingProduct.id);
        await setDoc(docRef, {...baseProductData, imageUrls: uploadedImageUrls}, { merge: true });
        toast({ title: "Produit mis à jour", description: `${baseProductData.name} a été mis à jour.` });
      } else {
        // --- CREATE LOGIC (handles multiple images) ---
        if (createMultipleFromImages && uploadedImageUrls.length > 1) {
            const creationPromises = uploadedImageUrls.map((url, index) => {
                const productDataForCreation = {
                    ...baseProductData,
                    imageUrls: [url], // Each product gets one image from the list
                    name: uploadedImageUrls.length > 1 ? `${baseProductData.name} - Style ${index + 1}` : baseProductData.name,
                };
                return addDoc(collection(db, "products"), productDataForCreation);
            });
            
            await Promise.all(creationPromises);
            
            toast({ 
                title: "Produits ajoutés", 
                description: `${creationPromises.length} produits distincts ont été créés avec succès.`
            });
        } else {
            // Create a single product with all images
            const singleProductData = {
                ...baseProductData,
                imageUrls: uploadedImageUrls,
            };
            await addDoc(collection(db, "products"), singleProductData);
            toast({ 
                title: "Produit ajouté", 
                description: `Un seul produit avec ${uploadedImageUrls.length} image(s) a été créé.`
            });
        }
      }
      fetchProductsAndCategories();
      closeDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du produit: ", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder le produit.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const openDialog = (product: Product | null = null) => {
      setEditingProduct(product);
      if (product) {
        setImageUrls(product.imageUrls || []);
        setVariants(product.variants || []);
        setIsNew(product.isNew || false);
        setName(product.name || '');
        setDescription(product.description || '');
      } else {
        // Reset for new product
        closeDialog();
      }
      setIsDialogOpen(true);
  }

  const closeDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(false);
    // Reset form states
    setImageFiles([]);
    setImageUrls([]);
    setImageUrlInput('');
    setVariants([]);
    setIsNew(false);
    setName('');
    setDescription('');
    setCreateMultipleFromImages(true);
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
        await deleteDoc(doc(db, "products", productId));
        toast({ title: "Produit supprimé", description: "Le produit a été supprimé avec succès." });
        fetchProductsAndCategories(); // Refresh the list
    } catch (error) {
        console.error("Erreur lors de la suppression: ", error);
        toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Produits</CardTitle>
          <CardDescription>Gérez vos produits ici. Les données sont stockées dans Firestore.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => {if(isSubmitting) e.preventDefault()}} onEscapeKeyDown={(e) => {if(isSubmitting) e.preventDefault()}}>
            <form onSubmit={handleSubmitProduct}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</DialogTitle>
                <DialogDescription>Remplissez les détails du produit, ajoutez des images et gérez les variantes.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Left Column: Product Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting}/>
                    </div>
                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <Label htmlFor="description">Description</Label>
                            <Button type="button" size="sm" onClick={handleGenerateProductInfo} disabled={isGeneratingInfo || (imageFiles.length === 0 && imageUrls.length === 0)}>
                                {isGeneratingInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Générer avec l'IA
                            </Button>
                        </div>
                        <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isSubmitting} rows={6} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix (FCFA)</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required disabled={isSubmitting}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="originalPrice">Prix barré (Optionnel)</Label>
                            <Input id="originalPrice" name="originalPrice" type="number" step="0.01" defaultValue={editingProduct?.originalPrice || ''} disabled={isSubmitting}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select name="category" defaultValue={editingProduct?.category} required disabled={isSubmitting}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="isNew" checked={isNew} onCheckedChange={setIsNew} disabled={isSubmitting} />
                        <Label htmlFor="isNew">Marquer comme nouveau</Label>
                    </div>
                </div>

                {/* Right Column: Images and Variants */}
                <div className="space-y-6">
                    {/* Image Management */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-medium">Images du produit</h4>
                         <div className="space-y-2">
                            <Label htmlFor="image-url">Ajouter une URL d'image</Label>
                            <div className="flex gap-2">
                                <Input id="image-url" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://example.com/image.png" />
                                <Button type="button" onClick={handleAddImageUrl}>Ajouter</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="product-images">Ou téléverser des images</Label>
                            <Input id="product-images" type="file" accept="image/*" multiple onChange={handleImageFilesChange} className="text-sm" disabled={isSubmitting}/>
                        </div>
                         {!editingProduct && (
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                id="create-multiple"
                                checked={createMultipleFromImages} 
                                onCheckedChange={(checked) => setCreateMultipleFromImages(Boolean(checked))}
                                />
                                <Label htmlFor="create-multiple" className="text-sm font-normal">
                                    Créer un produit distinct pour chaque image
                                </Label>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <Image src={url} alt={`Aperçu ${index}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square" />
                                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageUrls(prev => prev.filter(u => u !== url))}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                             {imageFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    <Image src={URL.createObjectURL(file)} alt={`Aperçu ${index}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square" />
                                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== index))}>
                                         <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Variant Management */}
                    <div className="space-y-4 rounded-lg border p-4">
                         <div className="flex justify-between items-center">
                            <h4 className="font-medium">Tailles et Stock</h4>
                            <Button type="button" size="sm" onClick={addVariant}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une taille
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {variants.map((variant, index) => (
                                <div key={index} className="grid grid-cols-3 gap-2 items-center">
                                    <div className="space-y-1">
                                      {index === 0 && <Label className='text-xs'>Taille</Label>}
                                      <Input placeholder="ex: M" value={variant.size || ''} onChange={e => updateVariant(index, 'size', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                      {index === 0 && <Label className='text-xs'>Stock</Label>}
                                      <Input 
                                        type="number" 
                                        placeholder="ex: 10" 
                                        value={variant.stock} 
                                        onChange={e => updateVariant(index, 'stock', e.target.value)}
                                      />
                                    </div>
                                    <div className='self-end'>
                                      <Button type="button" size="icon" variant="ghost" onClick={() => removeVariant(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer le produit
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
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Image src={product.imageUrls?.[0] || 'https://placehold.co/40x40.png'} alt={product.name} width={40} height={40} className="rounded-md" />
                        {product.name}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                    {product.originalPrice && (
                        <span className="line-through text-muted-foreground mr-2">{Math.round(product.originalPrice)} FCFA</span>
                    )}
                    {Math.round(product.price)} FCFA
                    </TableCell>
                    <TableCell>{product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}</TableCell>
                    <TableCell>
                        {product.isNew && <Badge>Nouveau</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog(product)}>Modifier</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Supprimer</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le produit <strong>{product.name}</strong> sera définitivement supprimé de la base de données.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Confirmer la suppression</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
