import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Post } from "@/lib/mock-data";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center gap-4">
            <Avatar>
            <AvatarImage src={post.authorImage} alt={post.author} />
            <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
            <p className="font-semibold">{post.author}</p>
            <p className="text-sm text-muted-foreground">{post.timestamp}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <Separator />
      <CardFooter className="p-0">
          <div className="flex justify-around w-full">
            <Button variant="ghost" className="flex-1 rounded-none text-muted-foreground">
                <ThumbsUp className="mr-2" /> Like
            </Button>
             <Button variant="ghost" className="flex-1 rounded-none text-muted-foreground">
                <MessageCircle className="mr-2" /> Comment
            </Button>
             <Button variant="ghost" className="flex-1 rounded-none text-muted-foreground">
                <Share2 className="mr-2" /> Share
            </Button>
          </div>
      </CardFooter>
    </Card>
  );
}
