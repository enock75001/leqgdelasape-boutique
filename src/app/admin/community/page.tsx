'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Post } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCommunityPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchPosts = async () => {
        setIsLoading(true);
        const q = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = (data.createdAt as Timestamp)?.toDate() || new Date();
            return {
                id: doc.id,
                ...data,
                createdAt,
                timestamp: formatDistanceToNow(createdAt, { addSuffix: true }),
            } as Post
        });
        setPosts(fetchedPosts);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            await deleteDoc(doc(db, "communityPosts", postId));
            setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
            toast({
                title: "Post Deleted",
                description: "The post has been successfully removed.",
            });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({
                title: "Error",
                description: "Could not delete the post. Please try again.",
                variant: "destructive",
            });
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Feed</CardTitle>
        <CardDescription>Manage posts from the community feed.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Author</TableHead>
                <TableHead className="w-[50%]">Content</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {posts.map((post) => (
                <TableRow key={post.id}>
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.authorImage} alt={post.author} />
                            <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{post.author}</span>
                    </div>
                    </TableCell>
                    <TableCell>
                        <p className="line-clamp-2">{post.content}</p>
                    </TableCell>
                    <TableCell>{post.timestamp}</TableCell>
                    <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
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
