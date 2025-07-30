'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { PostCard } from '@/components/community/post-card';
import { Post } from '@/lib/mock-data';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';


export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchPosts();
  }, []);

  const handleNewPost = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  return (
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="space-y-8">
          <CreatePostForm onNewPost={handleNewPost} />
          <div className="space-y-6">
            {isLoading ? (
                <>
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </>
            ) : (
                 posts.map(post => (
                    <PostCard key={post.id} post={post} />
                    ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
