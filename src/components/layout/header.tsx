
'use client';

import Link from 'next/link';
import { Store, Menu, ShoppingCart, X, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Announcement } from '@/lib/mock-data';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const navLinks = [
  { href: '/', label: 'Collection' },
];

function AnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const q = query(
                    collection(db, "announcements"), 
                    where("enabled", "==", true), 
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setAnnouncement(querySnapshot.docs[0].data() as Announcement);
                } else {
                    setAnnouncement(null);
                }
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
                setAnnouncement(null);
            }
        };
        fetchAnnouncement();
    }, []);

    if (!announcement) return null;

    const bannerClasses = cn(
      "w-full text-center p-2 text-sm font-medium",
      {
        'bg-primary text-primary-foreground': announcement.type === 'promotion',
        'bg-muted text-muted-foreground': announcement.type === 'info',
        'bg-destructive text-destructive-foreground': announcement.type === 'warning'
      }
    );

    const content = announcement.link ? (
      <Link href={announcement.link} className="hover:underline">
        {announcement.message}
      </Link>
    ) : (
      <span>{announcement.message}</span>
    );
    
    return <div className={bannerClasses}>{content}</div>
}


export function SiteHeader() {
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markAllAsRead, getUnreadCount } = useNotifications();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const clientNotifications = notifications.filter(n => n.recipient === 'client' && (n.userEmail === user?.email || !n.userEmail));
  const unreadClientNotifications = getUnreadCount('client', user?.email);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <AnnouncementBanner />
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-headline text-2xl font-bold text-primary">
          <Store className="h-7 w-7" />
          <span>LE QG DE LA SAPE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-2">
            {isClient && isAuthenticated ? (
              <>
                <Popover onOpenChange={(open) => { if(!open) markAllAsRead('client', user?.email)}}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadClientNotifications > 0 && (
                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground text-white">
                          {unreadClientNotifications}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="p-4">
                      <h4 className="font-medium text-center">Notifications</h4>
                    </div>
                    <Separator />
                    <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                      {clientNotifications.length > 0 ? clientNotifications.map(n => (
                        <div key={n.id} className={cn("p-2 rounded-md", n.read ? "opacity-60" : "bg-primary/10")}>
                           <p className="text-sm">{n.message}</p>
                           <p className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-center text-muted-foreground p-4">You have no new notifications.</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button variant="ghost" onClick={handleLogout}>Déconnecter</Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={user?.email === 'le.qg10delasape@gmail.com' ? '/admin' : '/account'}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                      <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>
              </>
            ) : isClient ? (
              <>
                <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/register">S'inscrire</Link>
                </Button>
              </>
            ) : null}
          </nav>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label={`Shopping cart with ${cartItemCount} items`}>
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </div>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 gap-4">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
             <hr />
             {isClient && isAuthenticated ? (
                <>
                    <Button variant="ghost" className="justify-start p-0 h-auto" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Déconnecter</Button>
                    <Link href={user?.email === 'le.qg10delasape@gmail.com' ? '/admin' : '/account'} onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">
                        Mon compte
                    </Link>
                </>
             ) : isClient ? (
                <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">Login</Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">S'inscrire</Link>
                </>
             ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
