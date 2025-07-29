'use client';

import { useState } from 'react';
import { CreatePostForm } from '@/components/community/create-post-form';
import { PostCard } from '@/components/community/post-card';
import { communityPosts as initialPosts, Post } from '@/lib/mock-data';

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handleNewPost = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary">Community Hub</h1>
        <p className="text-xl text-muted-foreground mt-2">Connect and share with the LE BLEU family.</p>
      </div>

      <div className="space-y-8">
        <CreatePostForm onNewPost={handleNewPost} />
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
