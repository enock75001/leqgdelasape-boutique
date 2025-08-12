
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ImageIcon, Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { CommunityPost } from '@/lib/mock-data';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Helper function to format time since a date
const timeSince = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " ans";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " mois";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " jours";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " heures";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes";
  return Math.floor(seconds) + " secondes";
};


function CreatePostCard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!content.trim() && !imageFile) {
            toast({ title: "Contenu vide", description: "Veuillez écrire un message ou ajouter une image.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl: string | undefined = undefined;
            if (imageFile) {
                const storageRef = ref(storage, `community/${user.uid}-${Date.now()}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'community_posts'), {
                userId: user.uid,
                userName: user.name,
                userAvatar: user.avatarUrl,
                content,
                imageUrl,
                createdAt: serverTimestamp(),
                likes: 0,
            });

            // Reset form
            setContent('');
            setImageFile(null);
            setImagePreview(null);
            toast({ title: "Publication réussie !", description: "Votre post est maintenant visible par la communauté." });
            // Ideally, we'd trigger a refetch of posts here
        } catch (error) {
            console.error("Error creating post:", error);
            toast({ title: "Erreur", description: "Impossible de créer la publication.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">Vous souhaitez partager votre style ?</p>
                    <Button asChild className="mt-4">
                        <Link href="/login">Connectez-vous pour publier</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex-row items-start gap-4">
                <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            placeholder={`Exprimez-vous, ${user.name}...`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="text-base border-0 focus-visible:ring-0 shadow-none p-0"
                            rows={3}
                        />
                        {imagePreview && (
                            <div className="mt-4 relative w-full h-64">
                                <Image src={imagePreview} alt="Aperçu" layout="fill" objectFit="cover" className="rounded-lg" />
                            </div>
                        )}
                        <div className="mt-4 flex justify-between items-center">
                            <label htmlFor="image-upload" className="cursor-pointer text-muted-foreground hover:text-primary">
                                <ImageIcon className="h-6 w-6" />
                                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Publier
                            </Button>
                        </div>
                    </form>
                </div>
            </CardHeader>
        </Card>
    );
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <Card className="overflow-hidden break-inside-avoid">
        {post.imageUrl && (
            <div className="relative aspect-[3/4]">
                <Image src={post.imageUrl} alt="Post image" layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
            </div>
        )}
        <CardContent className="p-4">
             <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
             <div className="flex items-center gap-2 mt-3 pt-3 border-t border-muted/20">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={post.userAvatar} />
                    <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-xs">
                    <p className="font-semibold text-foreground">{post.userName}</p>
                    <p className="text-muted-foreground">
                        {timeSince(post.createdAt.toDate())}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>
  )
}

export default function CommunityPage() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(50));
                const querySnapshot = await getDocs(q);
                const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
                toast({ title: "Erreur", description: "Impossible de charger le fil d'actualité.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchPosts();
    }, [toast]);


  return (
    <div className="container mx-auto max-w-7xl py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">Communauté</h1>
            <p className="text-lg text-muted-foreground mt-2">Partagez votre style, découvrez des inspirations.</p>
        </div>

        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
             <CreatePostCard />
             {isLoading ? (
                [...Array(8)].map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted/50"></Card>)
            ) : posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                !isLoading && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <p>Le fil d'actualité est encore vide.</p>
                        <p>Soyez le premier à publier !</p>
                    </div>
                )
            )}
        </div>
    </div>
  );
}
