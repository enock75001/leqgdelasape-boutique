
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, Variant, Category, Review } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, Trash2, Sparkles, Search, MoreHorizontal, Star, MessageSquare, Wand2, Warehouse, Copy } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, orderBy, query, writeBatch, arrayUnion, runTransaction, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow';
import { suggestCategoriesForProduct } from '@/ai/flows/suggest-categories-flow';
import { generatePromoFromProduct } from '@/ai/flows/generate-promo-from-product-flow';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { StarRating } from '@/components/products/star-rating';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to resize image
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const newFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(newFile);
                } else {
                    reject(new Error('Canvas to Blob conversion failed'));
                }
            }, file.type, 0.9); // 90% quality
        };
        img.onerror = (error) => reject(error);
    });
};


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state is now managed outside the dialog
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [variants, setVariants] = useState<Omit<Variant, 'id'>[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [createMultipleFromImages, setCreateMultipleFromImages] = useState(true);

  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);


  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkCategoryDialogOpen, setIsBulkCategoryDialogOpen] = useState(false);
  const [bulkSelectedCategories, setBulkSelectedCategories] = useState<string[]>([]);
  
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [currentReviews, setCurrentReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [productForReviews, setProductForReviews] = useState<Product | null>(null);
  const [generatingPromoProductId, setGeneratingPromoProductId] = useState<string | null>(null);

  const [isBulkStockDialogOpen, setIsBulkStockDialogOpen] = useState(false);
  const [bulkStockUpdates, setBulkStockUpdates] = useState<Record<string, Record<string, number>>>({});


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
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleAddImageUrl = () => {
    if (imageUrlInput && !imageUrls.includes(imageUrlInput)) {
      setImageUrls(prev => [...prev, imageUrlInput]);
      setImageUrlInput('');
    }
  };

  const handleImageFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const resizePromises = files.map(file => resizeImage(file, 1024, 1024));
      try {
        const resizedFiles = await Promise.all(resizePromises);
        setImageFiles(prev => [...prev, ...resizedFiles]);
        toast({ title: "Images prêtes", description: `${files.length} image(s) ont été redimensionnées et sont prêtes à être téléversées.` });
      } catch (error) {
        console.error("Image resize error:", error);
        toast({ title: "Erreur de redimensionnement", description: "Impossible de redimensionner une ou plusieurs images.", variant: "destructive" });
      }
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

  const handleSuggestCategories = async () => {
    if (!name && !description) {
        toast({title: "Informations manquantes", description: "Veuillez entrer un nom ou une description pour que l'IA puisse suggérer des catégories.", variant: "destructive"});
        return;
    }
    setIsGeneratingCategories(true);
    try {
        const existingCategoryNames = categories.map(c => c.name);
        const result = await suggestCategoriesForProduct({
            productName: name,
            productDescription: description,
            existingCategories: existingCategoryNames,
        });

        const newSuggestedCategories = [...new Set([...selectedCategories, ...result])];
        setSelectedCategories(newSuggestedCategories);

        const newCats = result.filter(c => !existingCategoryNames.includes(c));
        if (newCats.length > 0) {
            toast({title: "Catégories suggérées !", description: `L'IA a suggéré des catégories existantes et vous propose d'ajouter les nouvelles catégories suivantes : ${newCats.join(', ')}.`});
        } else {
            toast({title: "Catégories suggérées !", description: "L'IA a sélectionné les catégories les plus pertinentes pour vous."});
        }

    } catch (error) {
        console.error("Error suggesting categories:", error);
        toast({title: "Erreur de suggestion", description: "L'IA n'a pas pu suggérer de catégories.", variant: "destructive"});
    } finally {
        setIsGeneratingCategories(false);
    }
  }

  const resetFormState = () => {
    setEditingProduct(null);
    setImageFiles([]);
    setImageUrls([]);
    setImageUrlInput('');
    setVariants([]);
    setIsNew(false);
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setSelectedCategories([]);
    setCreateMultipleFromImages(true);
  };

  const handleSubmitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
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

    const baseProductData: Omit<Product, 'id' | 'categories'> & { categories: string[] } = {
      name: name,
      description: description,
      price: parseFloat(String(price)),
      originalPrice: originalPrice ? parseFloat(String(originalPrice)) : undefined,
      imageUrls: [], // Will be set per product
      categories: selectedCategories,
      variants: variants,
      isNew: isNew,
      reviewCount: editingProduct?.reviewCount || 0,
      averageRating: editingProduct?.averageRating || 0,
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
      setIsDialogOpen(false); // Close dialog on success
      resetFormState(); // And reset the form
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du produit: ", error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder le produit.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const populateFormForEditing = (product: Product) => {
    resetFormState();
    setEditingProduct(product);
    setImageUrls(product.imageUrls || []);
    setVariants(product.variants || []);
    setIsNew(product.isNew || false);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price || '');
    setOriginalPrice(product.originalPrice || '');
    setSelectedCategories(product.categories || []);
    setImageFiles([]); // Clear file inputs
    setImageUrlInput('');
    setIsDialogOpen(true);
  };
  
  const openDialogForNew = () => {
    resetFormState();
    setIsDialogOpen(true);
  };
  
  const openDialogForDuplicate = (product: Product) => {
    // Populate form like editing, but don't set editingProduct
    resetFormState(); // Start fresh
    setEditingProduct(null); // Ensure it's a new product
    setImageUrls(product.imageUrls || []);
    setVariants(product.variants || []);
    setIsNew(product.isNew || false);
    setName(`${product.name} (Copie)`);
    setDescription(product.description || '');
    setPrice(product.price || '');
    setOriginalPrice(product.originalPrice || '');
    setSelectedCategories(product.categories || []);
    setIsDialogOpen(true);
  };


  const handleDeleteProduct = async (productId: string) => {
    try {
        await deleteDoc(doc(db, "products", productId));
        toast({ title: "Produit supprimé", description: "Le produit a été supprimé avec succès." });
        fetchProductsAndCategories(); // Refresh the list
    } catch (error) {
        console.error("Erreur lors de la suppression: ", error);
        toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" });
    }
  };
  
  const handleSelectProduct = (productId: string, isSelected: boolean) => {
    setSelectedProductIds(prev =>
      isSelected ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };
  
  const handleSelectAllProducts = (isSelected: boolean) => {
    setSelectedProductIds(isSelected ? filteredProducts.map(p => p.id) : []);
  };
  
  const handleBulkUpdateCategories = async () => {
    if (selectedProductIds.length === 0 || bulkSelectedCategories.length === 0) {
      toast({ title: "Aucune sélection", description: "Veuillez sélectionner des produits et des catégories.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        selectedProductIds.forEach(productId => {
            const productRef = doc(db, "products", productId);
            batch.update(productRef, {
                categories: arrayUnion(...bulkSelectedCategories)
            });
        });
        await batch.commit();
        
        toast({ title: "Succès", description: `${selectedProductIds.length} produits ont été mis à jour.` });
        fetchProductsAndCategories();
        setIsBulkCategoryDialogOpen(false);
        setSelectedProductIds([]);
        setBulkSelectedCategories([]);
    } catch (error) {
        console.error("Erreur de mise à jour en masse:", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour les produits.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openReviewsDialog = async (product: Product) => {
    setProductForReviews(product);
    setIsReviewsDialogOpen(true);
    setLoadingReviews(true);
    try {
        const reviewsQuery = query(collection(db, `products/${product.id}/reviews`), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(reviewsQuery);
        const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setCurrentReviews(fetchedReviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        toast({ title: "Erreur", description: "Impossible de charger les avis.", variant: "destructive" });
    } finally {
        setLoadingReviews(false);
    }
  };

  const handleGeneratePromo = async (productId: string) => {
    setGeneratingPromoProductId(productId);
    try {
        const result = await generatePromoFromProduct(productId);
        if (result.error) {
            toast({ title: "Erreur de l'IA", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Promotion Créée", description: "La diapositive a été ajoutée au carrousel." });
        }
    } catch (e: any) {
        toast({ title: "Erreur", description: `Une erreur inattendue est survenue: ${e.message}`, variant: "destructive" });
    } finally {
        setGeneratingPromoProductId(null);
    }
  };


  const handleDeleteReview = async (reviewId: string) => {
    if (!productForReviews) return;

    try {
        const productRef = doc(db, 'products', productForReviews.id);
        const reviewRef = doc(db, `products/${productForReviews.id}/reviews`, reviewId);

        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            const reviewDoc = await transaction.get(reviewRef);

            if (!productDoc.exists() || !reviewDoc.exists()) {
                throw new Error("Le produit ou l'avis n'existe plus.");
            }
            
            const currentData = productDoc.data();
            const reviewData = reviewDoc.data();
            const currentReviewCount = currentData.reviewCount || 0;
            const currentAverageRating = currentData.averageRating || 0;
            
            if (currentReviewCount <= 1) {
                transaction.update(productRef, { reviewCount: 0, averageRating: 0 });
            } else {
                const newReviewCount = currentReviewCount - 1;
                const newTotalRating = (currentAverageRating * currentReviewCount) - reviewData.rating;
                const newAverageRating = newTotalRating / newReviewCount;
                transaction.update(productRef, {
                    reviewCount: newReviewCount,
                    averageRating: newAverageRating
                });
            }
            
            transaction.delete(reviewRef);
        });

        // Optimistically update UI
        setCurrentReviews(prev => prev.filter(r => r.id !== reviewId));
        // Also update the main products list to reflect the new rating
        fetchProductsAndCategories(); 
        
        toast({ title: "Avis supprimé", description: "L'avis a été supprimé et les notes ont été recalculées." });

    } catch (error) {
        console.error("Error deleting review:", error);
        toast({ title: "Erreur", description: "Impossible de supprimer l'avis.", variant: "destructive" });
    }
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
            const product = products.find(p => p.id === productId);
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
        toast({ title: "Stock mis à jour", description: "Le stock des produits sélectionnés a été mis à jour." });
        fetchProductsAndCategories();
        setIsBulkStockDialogOpen(false);
        setBulkStockUpdates({});
        setSelectedProductIds([]);
    } catch (error) {
        console.error("Error updating bulk stock:", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le stock.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Produits</CardTitle>
            <CardDescription>Gérez vos produits ici. Les données sont stockées dans Firestore.</CardDescription>
          </div>
           <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Rechercher par nom..."
                className="pl-8 sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {selectedProductIds.length > 0 && (
                <Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Actions pour {selectedProductIds.length} produits <MoreHorizontal className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Actions groupées</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setIsBulkCategoryDialogOpen(true)}>Modifier les catégories</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsBulkStockDialogOpen(true)}>Modifier le stock</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Dialog>
            )}
            <Button size="sm" className="gap-1" onClick={openDialogForNew}>
                <PlusCircle className="h-3.5 w-3.5" />
                Ajouter
            </Button>
           </div>
        </div>
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
                    <TableHead className="w-[1%]">
                        <Checkbox
                            onCheckedChange={handleSelectAllProducts}
                            checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégories</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock Total</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => (
                <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                    <TableCell>
                        <Checkbox
                            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                            checked={selectedProductIds.includes(product.id)}
                            aria-label={`Select ${product.name}`}
                        />
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Image src={product.imageUrls?.[0] || 'https://placehold.co/40x40.png'} alt={product.name} width={40} height={40} className="rounded-md" />
                        {product.name}
                    </TableCell>
                    <TableCell className='max-w-xs'>
                        <div className='flex flex-wrap gap-1'>
                            {product.categories?.map(cat => <Badge key={cat} variant='secondary' className='font-normal'>{cat}</Badge>)}
                        </div>
                    </TableCell>
                    <TableCell>
                    {product.originalPrice && (
                        <span className="line-through text-muted-foreground mr-2">{Math.round(product.originalPrice)} FCFA</span>
                    )}
                    {Math.round(product.price)} FCFA
                    </TableCell>
                    <TableCell>{product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>{product.averageRating?.toFixed(1) || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {product.isNew && <Badge>Nouveau</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => populateFormForEditing(product)}>
                                    Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialogForDuplicate(product)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Dupliquer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openReviewsDialog(product)}>
                                    Voir les avis
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleGeneratePromo(product.id)}
                                    disabled={generatingPromoProductId === product.id}
                                >
                                    {generatingPromoProductId === product.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Wand2 className="mr-2 h-4 w-4" />
                                    )}
                                    Créer une promo
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                                            Supprimer
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible. Le produit <strong>{product.name}</strong> sera définitivement supprimé.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                                Confirmer la suppression
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            <Input id="price" name="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} required disabled={isSubmitting}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="originalPrice">Prix barré (Optionnel)</Label>
                            <Input id="originalPrice" name="originalPrice" type="number" step="0.01" value={originalPrice} onChange={e => setOriginalPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} disabled={isSubmitting}/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="category">Catégories</Label>
                            <Button type="button" size="sm" onClick={handleSuggestCategories} disabled={isGeneratingCategories || (!name && !description)}>
                                {isGeneratingCategories ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Suggérer par IA
                            </Button>
                        </div>
                        <ScrollArea className="h-32 w-full rounded-md border p-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id={`cat-${cat.id}`}
                                checked={selectedCategories.includes(cat.name)}
                                onCheckedChange={(checked) => {
                                setSelectedCategories((prev) => 
                                    checked 
                                    ? [...prev, cat.name]
                                    : prev.filter((name) => name !== cat.name)
                                );
                                }}
                            />
                            <label
                                htmlFor={`cat-${cat.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {cat.name}
                            </label>
                            </div>
                        ))}
                        </ScrollArea>
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
                            <Label htmlFor="product-images">Ou téléverser des images (max 1024px, redimensionné automatiquement)</Label>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer le produit
                </Button>
            </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    <Dialog open={isBulkCategoryDialogOpen} onOpenChange={setIsBulkCategoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifier les catégories en masse</DialogTitle>
                <DialogDescription>
                    Ajoutez les {selectedProductIds.length} produits sélectionnés aux catégories ci-dessous.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label>Catégories à ajouter</Label>
                <ScrollArea className="h-48 w-full rounded-md border p-4 mt-2">
                {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                        id={`bulk-cat-${cat.id}`}
                        checked={bulkSelectedCategories.includes(cat.name)}
                        onCheckedChange={(checked) => {
                            setBulkSelectedCategories((prev) => 
                            checked 
                            ? [...prev, cat.name]
                            : prev.filter((name) => name !== cat.name)
                        );
                        }}
                    />
                    <label
                        htmlFor={`bulk-cat-${cat.id}`}
                        className="text-sm font-medium leading-none"
                    >
                        {cat.name}
                    </label>
                    </div>
                ))}
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkCategoryDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleBulkUpdateCategories} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Appliquer les modifications
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    <Dialog open={isBulkStockDialogOpen} onOpenChange={setIsBulkStockDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Modifier le stock en masse</DialogTitle>
                <DialogDescription>
                    Mettez à jour le stock pour les variantes des {selectedProductIds.length} produits sélectionnés.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-6">
                <div className="space-y-4">
                    {products.filter(p => selectedProductIds.includes(p.id)).map(product => (
                        <div key={product.id} className="p-4 border rounded-lg">
                            <h4 className="font-semibold">{product.name}</h4>
                            <div className="mt-2 space-y-2">
                                {product.variants.map((variant, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <Label className="w-1/3">{variant.size}</Label>
                                        <Input 
                                            type="number" 
                                            className="w-2/3"
                                            placeholder={`Stock actuel: ${variant.stock}`}
                                            onChange={(e) => handleStockInputChange(product.id, variant.size, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkStockDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleBulkStockUpdate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer les stocks
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isReviewsDialogOpen} onOpenChange={setIsReviewsDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Gérer les avis pour "{productForReviews?.name}"</DialogTitle>
                <DialogDescription>
                    Consultez et supprimez les avis laissés par les clients pour ce produit.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {loadingReviews ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : currentReviews.length > 0 ? (
                    <ScrollArea className="h-96 pr-4">
                        <div className="space-y-6">
                            {currentReviews.map(review => (
                                <div key={review.id} className="flex gap-4 items-start">
                                    <Avatar>
                                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.userName}</p>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <StarRating rating={review.rating} className="my-1"/>
                                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Aucun avis pour ce produit.</p>
                )}
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
