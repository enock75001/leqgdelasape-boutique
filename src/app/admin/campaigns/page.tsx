'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createCampaign } from '@/ai/flows/create-campaign-flow';

export default function AdminCampaignsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreateCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const htmlContent = formData.get('htmlContent') as string;
    const listIdsString = formData.get('listIds') as string;

    if (!name || !subject || !htmlContent || !listIdsString) {
        toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const listIds = listIdsString.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    if (listIds.length === 0) {
        toast({ title: "Erreur", description: "Veuillez fournir des ID de liste valides.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const result = await createCampaign({ name, subject, htmlContent, listIds });
        if (result.success) {
            toast({
                title: "Campagne Créée",
                description: "Votre campagne e-mail a été créée et est en cours d'envoi.",
            });
            (event.target as HTMLFormElement).reset();
        } else {
            throw new Error(result.message || "Une erreur inconnue est survenue.");
        }
    } catch (error) {
        toast({
            title: "Erreur",
            description: `Impossible de créer la campagne : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Créer une Campagne E-mail</CardTitle>
        <CardDescription>Envoyez une campagne e-mail à vos listes de contacts via Brevo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateCampaign} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la Campagne</Label>
            <Input id="name" name="name" placeholder="Ex: Lancement Collection Hiver 2024" required disabled={isSubmitting} />
            <p className="text-xs text-muted-foreground">Ce nom est pour votre référence interne uniquement.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Objet de l'E-mail</Label>
            <Input id="subject" name="subject" placeholder="Ex: Nouveautés : Découvrez notre collection Hiver !" required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="htmlContent">Contenu HTML de l'E-mail</Label>
            <Textarea 
              id="htmlContent" 
              name="htmlContent" 
              placeholder="<h1>Titre</h1><p>Ceci est un paragraphe. Vous pouvez utiliser du HTML ici.</p>" 
              required 
              disabled={isSubmitting}
              rows={15}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listIds">ID des Listes de Destinataires</Label>
            <Input id="listIds" name="listIds" placeholder="Ex: 2, 7, 14" required disabled={isSubmitting} />
            <p className="text-xs text-muted-foreground">Séparez les multiples ID de listes Brevo par des virgules.</p>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer et Envoyer la Campagne
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
