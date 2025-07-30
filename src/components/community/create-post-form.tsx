'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { moderateCommunityContent } from '@/ai/flows/moderate-community-content';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Post } from '@/lib/mock-data';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';


interface CreatePostFormProps {
  onNewPost: (post: Post) => void;
}

export function CreatePostForm({ onNewPost }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to create a post.',
            });
        }
        return
    };

    setIsLoading(true);
    try {
      const moderationResult = await moderateCommunityContent({ content });

      if (moderationResult.isViolating) {
        toast({
          variant: 'destructive',
          title: 'Content Violation',
          description: `Your post could not be published. Reason: ${moderationResult.reason}`,
        });
      } else {
        
        const postData = {
          author: user.email, // This would be dynamic in a real app
          authorImage: 'https://placehold.co/100x100.png',
          content: content,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "communityPosts"), postData);
        
        const newPost: Post = {
          id: docRef.id,
          author: postData.author,
          authorImage: postData.authorImage,
          content: postData.content,
          timestamp: 'Just now',
          createdAt: new Date(),
        };

        onNewPost(newPost);
        setContent('');
        toast({
          title: 'Post Published!',
          description: 'Your post is now live in the community feed.',
        });
      }
    } catch (error) {
      console.error('Error moderating or saving content:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit post. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
       <form onSubmit={handleSubmit}>
        <CardHeader className="p-4">
            <div className="flex gap-4 items-start">
            <Avatar>
                <AvatarImage src="https://placehold.co/100x100.png" alt="Current User" />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                disabled={isLoading || !user}
                className="border-none shadow-none focus-visible:ring-0 text-base"
            />
            </div>
        </CardHeader>
        <CardFooter className="p-4 pt-0">
            <Button type="submit" disabled={isLoading || !content.trim() || !user} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
