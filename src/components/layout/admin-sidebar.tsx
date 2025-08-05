
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, ShoppingCart, Store, Bell, Users, Ticket, CreditCard, Truck, Megaphone, LogOut, GalleryHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/carousel', label: 'Carrousel', icon: GalleryHorizontal },
  { href: '/admin/announcements', label: 'Annonces', icon: Megaphone },
  { href: '/admin/users', label: 'Clients', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/payments', label: 'Moyens de paiement', icon: CreditCard },
  { href: '/admin/shipping', label: 'Moyens de livraison', icon: Truck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications, markAllAsRead, getUnreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const adminNotifications = notifications.filter(n => n.recipient === 'admin');
  const unreadAdminNotifications = getUnreadCount('admin', user?.email);

  useEffect(() => {
    // Demander l'autorisation pour les notifications de bureau
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
  }, [toast]);

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-6 justify-between">
        <Link href="/" className="flex items-center">
          <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE" width={120} height={50} className="object-contain" />
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
      <nav className="flex-grow p-4">
        <ul className='flex flex-col h-full'>
          {navItems.map((item) => (
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
          <li className="mt-auto">
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
