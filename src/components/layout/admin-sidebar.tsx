
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, ShoppingCart, Bell, Users, Ticket, CreditCard, Truck, Megaphone, LogOut, GalleryHorizontal, LayoutGrid, Settings, Activity, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { useAuth } from '@/context/auth-context';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const adminNavItems = [
    { href: '/admin', label: 'Tableau de bord', icon: Home },
    { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
    { href: '/admin/products', label: 'Produits', icon: Package },
    { href: '/admin/categories', label: 'Catégories', icon: LayoutGrid },
    { href: '/admin/users', label: 'Clients', icon: Users },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/shipping', label: 'Livraison', icon: Truck },
    { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
    { href: '/admin/announcements', label: 'Annonces', icon: Megaphone },
    { href: '/admin/carousel', label: 'Carrousel', icon: GalleryHorizontal },
    { href: '/admin/image-generator', label: "Générateur d'Images", icon: Wand2 },
    { href: '/admin/logs', label: 'Logs', icon: Activity },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications, markAllAsRead, getUnreadCount, addNotification } = useNotifications();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const adminNotifications = notifications.filter(n => n.recipient === 'admin');
  const unreadAdminNotifications = getUnreadCount('admin', user?.email);

  const unsubscribeRef = useRef<() => void | undefined>();

  useEffect(() => {
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            toast({
                title: "Activer les notifications",
                description: "Nous allons demander l'autorisation d'afficher les notifications pour les nouvelles commandes.",
                duration: 5000,
            });
            Notification.requestPermission();
        }
    }

    if (user && !unsubscribeRef.current) {
        const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
        
        const q = query(
            collection(db, "orders"), 
            where("date", ">", fiveMinutesAgo.toDate().toISOString())
        );

        unsubscribeRef.current = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const order = change.doc.data();
                    addNotification({
                        recipient: 'admin',
                        message: `Nouvelle commande #${change.doc.id.slice(-6)} reçue pour ${Math.round(order.total)} FCFA.`
                    });
                }
            });
        }, (error) => {
            console.error("Erreur d'écoute des commandes: ", error);
            toast({
                title: "Erreur de connexion temps-réel",
                description: "Impossible d'écouter les nouvelles commandes. Veuillez rafraîchir la page.",
                variant: "destructive"
            })
        });
    }
    
    return () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = undefined;
        }
    };
  }, [user, addNotification, toast]);

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col h-screen sticky top-0">
      <div className="h-16 border-b flex items-center px-4 justify-between flex-shrink-0">
        <Link href="/admin" className="flex items-center gap-2">
            <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="Logo" width={32} height={32} className="rounded-full object-cover" />
            <span className="font-headline text-lg font-bold">LE QG DE LA SAPE</span>
        </Link>
        <Popover onOpenChange={(open) => { if (!open) markAllAsRead('admin'); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadAdminNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                        {unreadAdminNotifications}
                    </span>
                )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 mr-4">
                <div className="p-4">
                    <h4 className="font-medium text-center">Notifications Administrateur</h4>
                </div>
                <Separator />
                <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                    {adminNotifications.length > 0 ? adminNotifications.map(n => (
                        <div key={n.id} className={cn("p-2 rounded-md", n.read ? "opacity-60" : "bg-blue-50")}>
                           <p className="text-sm">{n.message}</p>
                           <p className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-center text-muted-foreground p-4">Vous n'avez aucune nouvelle notification.</p>
                      )}
                </div>
          </PopoverContent>
        </Popover>
      </div>
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className='flex flex-col h-full'>
          {adminNavItems.map((item) => (
            <li key={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            </li>
          ))}
          <li className="mt-auto pt-4">
             <Button
                variant='ghost'
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnecter
              </Button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
