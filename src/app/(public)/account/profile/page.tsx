
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { user, loading, refreshAuth } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(user?.avatarUrl || null);
    const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setImagePreview(user.avatarUrl || null);
        }
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmittingInfo(true);

        let avatarUrl = user.avatarUrl;

        if (imageFile) {
            const storageRef = ref(storage, `avatars/${user.email}_${Date.now()}`);
            try {
                const snapshot = await uploadBytes(storageRef, imageFile);
                avatarUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading avatar:", error);
                toast({ title: "Erreur", description: "Impossible de téléverser l'avatar.", variant: "destructive" });
                setIsSubmittingInfo(false);
                return;
            }
        }

        try {
            const userRef = doc(db, "users", user.email);
            await setDoc(userRef, { name, email, avatarUrl }, { merge: true });
            toast({
                title: "Profil mis à jour",
                description: "Les informations de votre profil ont été mises à jour avec succès.",
            });
            refreshAuth(); // Refresh user data in context
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
        } finally {
            setIsSubmittingInfo(false);
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ title: "Erreur", description: "Les nouveaux mots de passe ne correspondent pas.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Erreur", description: "Le nouveau mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
            return;
        }
        
        setIsSubmittingPassword(true);
        // NOTE: In a real app, you would call Firebase Auth's `updatePassword` method here.
        // This requires re-authentication for security reasons.
        // For this demo, we'll just simulate the action.
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
            title: "Mot de passe mis à jour",
            description: "Votre mot de passe a été modifié avec succès.",
        });

        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsSubmittingPassword(false);
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/account">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-headline font-bold">Profil</h1>
                    <p className="text-muted-foreground">Gérez vos informations personnelles et votre mot de passe.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInfoSubmit} className="space-y-6 max-w-lg">
                        <div className="flex items-center space-x-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={imagePreview || undefined} alt={name} />
                                <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="picture">Photo de profil</Label>
                                <Input id="picture" type="file" onChange={handleImageChange} accept="image/*" />
                                <p className="text-xs text-muted-foreground">Téléversez votre photo de profil (JPG, PNG).</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmittingInfo} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Adresse e-mail</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={true} />
                        </div>
                        <Button type="submit" disabled={isSubmittingInfo}>
                            {isSubmittingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sauvegarder les modifications
                        </Button>
                    </form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Changer le mot de passe</CardTitle>
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
        </div>
    );
}
