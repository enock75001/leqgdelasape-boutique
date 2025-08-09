'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Download, Image as ImageIcon } from "lucide-react";
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generator-flow';

export default function ImageGeneratorPage() {
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerateImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast({ title: "Erreur", description: "Veuillez entrer une description pour l'image.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setGeneratedImage(null);

        try {
            const result = await generateImage(prompt);
            if (result.error) {
                toast({ title: "Erreur de génération", description: result.error, variant: "destructive" });
            } else {
                setGeneratedImage(result.imageDataUri);
                toast({ title: "Succès", description: "Votre image a été générée." });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur", description: "Une erreur inattendue est survenue.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        const fileName = prompt.substring(0, 20).replace(/\s+/g, '_') || 'image_generee';
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-headline font-bold">Générateur d'Images par IA</h1>
            
            <Card>
                <form onSubmit={handleGenerateImage}>
                    <CardHeader>
                        <CardTitle>Créez votre Visuel</CardTitle>
                        <CardDescription>Décrivez l'image que vous souhaitez créer. Soyez aussi détaillé que possible pour un meilleur résultat.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Description de l'image (Prompt)</Label>
                            <Textarea 
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Un t-shirt blanc sur un cintre en bois, fond de studio minimaliste, lumière douce."
                                rows={4}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Générer l'image
                        </Button>
                    </CardContent>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Résultat</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[30rem] bg-muted/30 rounded-lg">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto" />
                            <p>Génération en cours... Ceci peut prendre jusqu'à une minute.</p>
                        </div>
                    ) : generatedImage ? (
                        <Image src={generatedImage} alt="Image générée par IA" width={512} height={512} className="rounded-md shadow-lg" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                             <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                            <p>L'image générée apparaîtra ici.</p>
                        </div>
                    )}
                </CardContent>
                {generatedImage && (
                    <CardFooter className="justify-end">
                        <Button onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
