
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findSimilarProductsByImage } from '@/ai/flows/visual-search-flow';
import { Product } from '@/lib/mock-data';
import { ProductCard } from '../products/product-card';
import Image from 'next/image';

interface VisualSearchProps {
  allProducts: Product[];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function VisualSearch({ allProducts }: VisualSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setResults([]); // Clear previous results
    }
  };

  const handleSearch = async () => {
    if (!imageFile) {
      toast({ title: 'Aucune image sélectionnée', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const imageDataUri = await fileToDataUrl(imageFile);
      const { similarProductIds } = await findSimilarProductsByImage({ photoDataUri: imageDataUri });

      if (similarProductIds.length === 0) {
        toast({ title: 'Aucun résultat', description: "Nous n'avons trouvé aucun produit similaire." });
      }

      const foundProducts = allProducts.filter(p => similarProductIds.includes(p.id));
      setResults(foundProducts);

    } catch (error) {
      console.error('Visual search failed:', error);
      toast({ title: 'Erreur', description: 'La recherche visuelle a échoué.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSearch = () => {
    setImageFile(null);
    setImagePreview(null);
    setResults([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <section className="bg-muted/40 border-t border-b border-border/20 py-8 my-8">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-6 cursor-pointer group">
                <Camera className="h-12 w-12 text-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <div className="flex-grow">
                    <h2 className="text-2xl font-headline font-bold text-primary group-hover:text-primary/80 transition-colors">Recherche par Image</h2>
                    <p className="text-muted-foreground mt-1">Vous avez vu un style qui vous plaît ? Téléchargez une photo et laissez-nous trouver ce que vous cherchez.</p>
                </div>
            </div>
        </section>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recherche Visuelle par IA</DialogTitle>
          <DialogDescription>
            Téléversez une image pour trouver des articles similaires dans notre catalogue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 flex-grow min-h-0">
          {/* Left Panel: Upload */}
          <div className="flex flex-col items-center justify-center border rounded-lg p-6 space-y-4">
            {imagePreview ? (
              <div className="relative w-full h-64">
                <Image src={imagePreview} alt="Aperçu" layout="fill" objectFit="contain" className="rounded-md" />
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80" onClick={resetSearch}>
                    <X className="h-4 w-4" />
                 </Button>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg w-full h-64">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <Label htmlFor="visual-search-file" className="text-primary font-semibold cursor-pointer hover:underline">
                        Choisissez un fichier
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">ou glissez-déposez une image ici</p>
                    <Input id="visual-search-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef}/>
                </div>
            )}
            <Button onClick={handleSearch} disabled={isLoading || !imageFile} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
              Trouver des articles similaires
            </Button>
          </div>

          {/* Right Panel: Results */}
          <div className="border rounded-lg flex flex-col">
             <h3 className="p-4 font-semibold border-b">Résultats</h3>
             <div className="p-4 flex-grow overflow-y-auto">
              {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : results.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                      {results.map(product => (
                          <ProductCard key={product.id} product={product} />
                      ))}
                  </div>
              ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>Les produits correspondants apparaîtront ici.</p>
                  </div>
              )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
