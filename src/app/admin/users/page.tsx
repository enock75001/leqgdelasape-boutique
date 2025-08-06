
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              registeredAt: data.createdAt?.toDate()?.toLocaleDateString() || 'N/A',
          } as User;
      });
      setUsers(usersData);
    } catch (error) {
        console.error("Error fetching users:", error);
        toast({
            title: "Error",
            description: "Could not load users. Please check Firestore security rules.",
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleDeleteUser = async (userId: string) => {
      // Note: This only deletes the Firestore document.
      // For full deletion, you must also delete the user from Firebase Auth.
      // This typically requires a backend function (e.g., Firebase Cloud Function)
      // to handle the privileged operation of deleting a user from Auth.
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        toast({
          title: "Utilisateur supprimé (DB)",
          description: "L'enregistrement de l'utilisateur a été supprimé de Firestore.",
        });
      } catch (error) {
         console.error("Error deleting user from Firestore:", error);
         toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur de la base de données.", variant: "destructive" });
      }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>Gérez les clients de votre application depuis Firestore.</CardDescription>
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
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                    </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'secondary' : 'outline'}>
                            {user.role}
                        </Badge>
                    </TableCell>
                    <TableCell>{user.registeredAt}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                disabled={currentUser?.role !== 'admin' || user.email === 'le.qg10delasape@gmail.com'}>
                                Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le compte de <strong>{user.name}</strong> sera supprimé de la base de données. Pour une suppression complète, vous devrez aussi le supprimer de Firebase Authentication.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Confirmer la suppression</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
