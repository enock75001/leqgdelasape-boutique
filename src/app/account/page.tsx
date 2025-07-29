import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
       <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold text-primary">My Account</h1>
        <p className="text-xl text-muted-foreground mt-2">Welcome back, valued customer!</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Here is your account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
             <User className="h-8 w-8 text-muted-foreground" />
             <div>
                <p className="font-semibold">customer@example.com</p>
                <p className="text-sm text-muted-foreground">Your personal account</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
