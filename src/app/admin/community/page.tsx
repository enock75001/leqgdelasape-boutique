import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { communityPosts } from "@/lib/mock-data";

export default function AdminCommunityPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Feed</CardTitle>
        <CardDescription>Manage posts from the community feed.</CardDescription>
      </CardHeader>
      <CardContent>
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
            {communityPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.authorImage} alt={post.author} />
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <span className="font-medium">{post.author}</span>
                  </div>
                </TableCell>
                <TableCell>
                    <p className="truncate">{post.content}</p>
                </TableCell>
                <TableCell>{post.timestamp}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
