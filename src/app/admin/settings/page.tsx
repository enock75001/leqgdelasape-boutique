
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, UserPlus, Info } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { collection, getDocs, writeBatch, setDoc, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/context/auth-context';
import { SiteInfo } from '@/lib/mock-data';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const isManager = currentUser?.role === 'manager';

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    const [managerName, setManagerName] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPassword, setManagerPassword] = useState('');
    const [isCreatingManager, setIsCreatingManager] = useState(false);
    
    const [siteInfo, setSiteInfo] = useState<SiteInfo>({});
    const [isSubmittingSiteInfo, setIsSubmittingSiteInfo] = useState(false);
    
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const fetchSiteInfo = async () => {
            const docRef = doc(db, "settings", "siteInfo");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSiteInfo(docSnap.data() as SiteInfo);
            }
        };
        fetchSiteInfo();
    }, []);

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

    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!managerName || !managerEmail || !managerPassword) {
            toast({ title: "Erreur", description: "Veuillez remplir tous les champs pour créer un gérant.", variant: "destructive" });
            return;
        }
        setIsCreatingManager(true);
        try {
            // Note: This creates a new user in a separate auth instance.
            // This is a simplified approach. For production, you'd use a backend function.
            // We'll create the user and then sign back in as the admin.
            const adminUser = auth.currentUser;
            if(!adminUser) throw new Error("Admin user not found");

            const tempAuth = auth; // Use the same auth instance
            const userCredential = await createUserWithEmailAndPassword(tempAuth, managerEmail, managerPassword);
            
            const managerData = {
                name: managerName,
                email: managerEmail,
                role: 'manager',
                avatarUrl: `https://placehold.co/100x100.png?text=${managerName.charAt(0)}`,
                createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "users", userCredential.user.uid), managerData);

            toast({ title: "Gérant créé", description: `Le compte pour ${managerName} a été créé avec succès.` });
            setManagerName('');
            setManagerEmail('');
            setManagerPassword('');
        } catch (error: any) {
            let description = "Impossible de créer le gérant.";
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    description = "Cette adresse e-mail est déjà utilisée par un autre compte.";
                } else if (error.code === 'auth/weak-password') {
                    description = "Le mot de passe doit contenir au moins 6 caractères.";
                }
            }
            console.error("Error creating manager:", error);
            toast({ title: "Erreur", description, variant: "destructive" });
        } finally {
            setIsCreatingManager(false);
        }
    }

    const handleSiteInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSiteInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSiteInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingSiteInfo(true);
        try {
            const docRef = doc(db, "settings", "siteInfo");
            await setDoc(docRef, siteInfo, { merge: true });
            toast({ title: "Succès", description: "Les informations du site ont été mises à jour." });
        } catch (error) {
            console.error("Error updating site info:", error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour les informations.", variant: "destructive" });
        } finally {
            setIsSubmittingSiteInfo(false);
        }
    };


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
            <h1 className="text-3xl font-headline font-bold">Paramètres</h1>
             {isManager && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">Accès Restreint</p>
                    <p>Votre rôle de gérant ne vous autorise pas à modifier ces paramètres.</p>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Changer le mot de passe</CardTitle>
                        <CardDescription>Mettez à jour votre mot de passe.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <fieldset disabled={isManager}>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                                <Button type="submit" disabled={isSubmittingPassword || isManager}>
                                    {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Changer le mot de passe
                                </Button>
                            </form>
                        </fieldset>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Info className="h-6 w-6"/>
                            <CardTitle>Informations Publiques du Site</CardTitle>
                        </div>
                        <CardDescription>Gérez les informations de contact affichées sur votre site.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <fieldset disabled={isManager}>
                            <form onSubmit={handleSiteInfoSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebookUrl">Lien page Facebook</Label>
                                    <Input id="facebookUrl" name="facebookUrl" value={siteInfo.facebookUrl || ''} onChange={handleSiteInfoChange} disabled={isSubmittingSiteInfo} placeholder="https://facebook.com/votresociete" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tiktokUrl">Lien profil TikTok</Label>
                                    <Input id="tiktokUrl" name="tiktokUrl" value={siteInfo.tiktokUrl || ''} onChange={handleSiteInfoChange} disabled={isSubmittingSiteInfo} placeholder="https://tiktok.com/@votresociete"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerServicePhone">Téléphone Service Client</Label>
                                    <Input id="customerServicePhone" name="customerServicePhone" value={siteInfo.customerServicePhone || ''} onChange={handleSiteInfoChange} disabled={isSubmittingSiteInfo} placeholder="+225 01 02 03 04 05" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="storeAddress">Adresse du magasin</Label>
                                    <Input id="storeAddress" name="storeAddress" value={siteInfo.storeAddress || ''} onChange={handleSiteInfoChange} disabled={isSubmittingSiteInfo} placeholder="Abidjan, Angré, 8ème tranche"/>
                                </div>
                                <Button type="submit" disabled={isSubmittingSiteInfo || isManager}>
                                    {isSubmittingSiteInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sauvegarder les informations
                                </Button>
                            </form>
                        </fieldset>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <UserPlus className="h-6 w-6"/>
                            <CardTitle>Créer un Gérant</CardTitle>
                        </div>
                        <CardDescription>Créez un compte pour un gérant qui aura accès à la gestion des commandes et des produits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <fieldset disabled={isManager}>
                            <form onSubmit={handleCreateManager} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="managerName">Nom du gérant</Label>
                                    <Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} disabled={isCreatingManager} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="managerEmail">Email du gérant</Label>
                                    <Input id="managerEmail" type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} disabled={isCreatingManager} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="managerPassword">Mot de passe</Label>
                                    <Input id="managerPassword" type="password" value={managerPassword} onChange={(e) => setManagerPassword(e.target.value)} disabled={isCreatingManager} required />
                                </div>
                                <Button type="submit" disabled={isCreatingManager || isManager}>
                                    {isCreatingManager && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Créer le compte gérant
                                </Button>
                            </form>
                        </fieldset>
                    </CardContent>
                </Card>

                <Card className="border-destructive bg-destructive/10">
                    <CardHeader>
                        <div className="flex items-center gap-3 text-destructive">
                            <ShieldAlert className="h-6 w-6"/>
                            <CardTitle>Zone de Danger</CardTitle>
                        </div>
                        <CardDescription className="text-destructive/80">
                            Ces actions sont irréversibles. Seul un administrateur peut effectuer ces actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <fieldset disabled={isManager}>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isResetting || isManager}>
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
                        </fieldset>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-destructive/70">
                        La réinitialisation des commandes efface également les données utilisées pour les statistiques du tableau de bord.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
