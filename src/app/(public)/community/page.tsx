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
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="space-y-8">
          <CreatePostForm onNewPost={handleNewPost} />
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
