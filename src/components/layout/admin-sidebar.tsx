'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, Droplet, Bell, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/community', label: 'Community', icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { notifications, markAllAsRead, getUnreadCount } = useNotifications();
  
  const adminNotifications = notifications.filter(n => n.recipient === 'admin');
  const unreadAdminNotifications = getUnreadCount('admin');

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-6 justify-between">
        <Link href="/" className="flex items-center gap-2 font-headline text-xl font-bold text-primary">
          <Droplet className="h-6 w-6" />
          <span>LE BLEU</span>
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
                    <h4 className="font-medium text-center">Admin Notifications</h4>
                </div>
                <Separator />
                <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                    {adminNotifications.length > 0 ? adminNotifications.map(n => (
                        <div key={n.id} className={cn("p-2 rounded-md", n.read ? "opacity-60" : "bg-blue-50")}>
                           <p className="text-sm">{n.message}</p>
                           <p className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-center text-muted-foreground p-4">You have no new notifications.</p>
                      )}
                </div>
          </PopoverContent>
        </Popover>
      </div>
      <nav className="flex-grow p-4">
        <ul>
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
        </ul>
      </nav>
    </aside>
  );
}
