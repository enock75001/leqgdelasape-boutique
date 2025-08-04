
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
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Announcement } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Announcement));
        setAnnouncements(data);
    } catch (error) {
        console.error("Error fetching announcements: ", error);
        toast({ title: "Erreur", description: "Impossible de charger les annonces.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSaveAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get('message') as string;
    const type = formData.get('type') as Announcement['type'];
    const link = formData.get('link') as string;
    
    if (!message.trim() || !type) {
        toast({ title: "Erreur", description: "Le message et le type sont requis.", variant: "destructive" });
        return;
    }
    
    const announcementData = {
        message,
        type,
        link: link || '',
        enabled: editingAnnouncement ? editingAnnouncement.enabled : true,
    };

    try {
        if (editingAnnouncement) {
            const announceRef = doc(db, "announcements", editingAnnouncement.id);
            await setDoc(announceRef, announcementData, { merge: true });
            toast({ title: "Succès", description: `Annonce mise à jour.` });
        } else {
            await addDoc(collection(db, "announcements"), announcementData);
            toast({ title: "Succès", description: `Annonce ajoutée.` });
        }
        fetchAnnouncements();
        closeDialog();
    } catch (error) {
        console.error("Error saving announcement: ", error);
        toast({ title: "Erreur", description: "Impossible d'enregistrer l'annonce.", variant: "destructive" });
    }
  };
  
  const openDialog = (announcement: Announcement | null = null) => {
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setEditingAnnouncement(null);
    setIsDialogOpen(false);
  }

  const toggleEnabled = async (announcement: Announcement) => {
    try {
        const announceRef = doc(db, "announcements", announcement.id);
        await updateDoc(announceRef, { enabled: !announcement.enabled });
        setAnnouncements(prev => 
            prev.map(a => a.id === announcement.id ? { ...a, enabled: !a.enabled } : a)
        );
        toast({ title: "Statut mis à jour", description: `L'annonce a été ${!announcement.enabled ? 'activée' : 'désactivée'}.` });
    } catch (error) {
        console.error("Error updating announcement: ", error);
        toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
     if(confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
        try {
            await deleteDoc(doc(db, "announcements", announcementId));
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            toast({ title: "Succès", description: "L'annonce a été supprimée." });
        } catch (error) {
            console.error("Error deleting announcement: ", error);
            toast({ title: "Erreur", description: "Impossible de supprimer l'annonce.", variant: "destructive" });
        }
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Annonces du Site</CardTitle>
          <CardDescription>Gérez les bannières de promotion et d'information de votre site.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={() => openDialog()}>
              <PlusCircle className="h-3.5 w-3.5" />
              Ajouter une Annonce
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={closeDialog}>
            <form onSubmit={handleSaveAnnouncement}>
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Modifier' : 'Nouvelle'} Annonce</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" defaultValue={editingAnnouncement?.message} placeholder="Ex: Livraison gratuite pour les commandes de plus de 50€ !" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Type d'annonce</Label>
                    <Select name="type" defaultValue={editingAnnouncement?.type || 'promotion'} required>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="promotion">Promotion (Bleu)</SelectItem>
                            <SelectItem value="info">Info (Gris)</SelectItem>
                            <SelectItem value="warning">Avertissement (Rouge)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="link">Lien (Optionnel)</Label>
                    <Input id="link" name="link" defaultValue={editingAnnouncement?.link} placeholder="Ex: /products/new-collection" />
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
                <TableHead>Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.message}</TableCell>
                  <TableCell>{announcement.type}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                            id={`switch-${announcement.id}`}
                            checked={announcement.enabled}
                            onCheckedChange={() => toggleEnabled(announcement)}
                        />
                        <Label htmlFor={`switch-${announcement.id}`}>{announcement.enabled ? 'Activé' : 'Désactivé'}</Label>
                      </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(announcement)}>Modifier</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAnnouncement(announcement.id)}>Supprimer</Button>
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

