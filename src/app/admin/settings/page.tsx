
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const firebaseUser = auth.currentUser;

        if (!firebaseUser) {
            toast({ title: "Erreur", description: "Vous n'êtes pas connecté.", variant: "destructive" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Erreur", description: "Les nouveaux mots de passe ne correspondent pas.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Erreur", description: "Le nouveau mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
            return;
        }
        
        setIsSubmittingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(firebaseUser.email!, oldPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);
            
            toast({
                title: "Mot de passe mis à jour",
                description: "Votre mot de passe a été modifié avec succès.",
            });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
             console.error("Password update error", error);
             let description = "Une erreur est survenue.";
             if (error.code === 'auth/wrong-password') {
                description = "L'ancien mot de passe est incorrect.";
             } else if (error.code === 'auth/too-many-requests') {
                 description = "Trop de tentatives. Veuillez réessayer plus tard.";
             }
             toast({ title: "Échec de la mise à jour", description, variant: "destructive"});
        } finally {
            setIsSubmittingPassword(false);
        }
    }

    const handleResetOrders = async () => {
        setIsResetting(true);
        try {
            const ordersQuery = await getDocs(collection(db, "orders"));
            if (ordersQuery.empty) {
                toast({ title: "Aucune commande", description: "Il n'y a aucune commande à supprimer." });
                return;
            }

            const batch = writeBatch(db);
            ordersQuery.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            toast({ title: "Succès", description: "Toutes les commandes ont été supprimées." });
            // Refresh the dashboard page to reflect changes
            router.refresh();

        } catch (error) {
            console.error("Error resetting orders: ", error);
            toast({ title: "Erreur", description: "Impossible de réinitialiser les commandes.", variant: "destructive" });
        } finally {
            setIsResetting(false);
        }
    }


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-headline font-bold">Paramètres Administrateur</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Changer le mot de passe</CardTitle>
                    <CardDescription>Mettez à jour le mot de passe de votre compte administrateur.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Ancien mot de passe</Label>
                            <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={isSubmittingPassword} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSubmittingPassword} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmittingPassword} required />
                        </div>
                        <Button type="submit" disabled={isSubmittingPassword}>
                            {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Changer le mot de passe
                        </Button>
                    </form>
                </CardContent>
            </Card>

             <Card className="border-destructive bg-destructive/10">
                <CardHeader>
                    <div className="flex items-center gap-3 text-destructive">
                        <ShieldAlert className="h-6 w-6"/>
                        <CardTitle>Zone de Danger</CardTitle>
                    </div>
                    <CardDescription className="text-destructive/80">
                        Ces actions sont irréversibles. Soyez absolument certain avant de continuer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Réinitialiser Commandes & Statistiques
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action supprimera définitivement toutes les commandes de votre base de données.
                                        Les statistiques du tableau de bord seront également remises à zéro. Cette action est irréversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={handleResetOrders}
                                    >
                                        Oui, tout supprimer
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-destructive/70">
                       La réinitialisation des commandes efface également les données utilisées pour les statistiques du tableau de bord.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
