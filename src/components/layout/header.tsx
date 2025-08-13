
'use client';

import Link from 'next/link';
import { Store, Menu, ShoppingCart, X, User, Bell, Search, Trash2, MinusCircle, PlusCircle, Share, PlusSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Announcement, SiteInfo } from '@/lib/mock-data';
import { collection, getDocs, limit, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '../ui/input';
import { useSearch } from '@/context/search-context';
import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { usePwa } from '@/context/pwa-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M16.5,13.62A3.48,3.48,0,0,0,18,10.2a3.3,3.3,0,0,0-3.46-3.72,4.3,4.3,0,0,0-3.29,1.74A4.33,4.33,0,0,0,8,6.48,3.34,3.34,0,0,0,4.5,10.2a3.49,3.49,0,0,0,1.5,3.14A4.55,4.55,0,0,0,6,20.28a2,2,0,0,0,2,1.22,1.87,1.87,0,0,0,1.88-1.2,3.34,3.34,0,0,1,2.24,0,1.88,1.88,0,0,0,1.88,1.2,2,2,0,0,0,2-1.22A4.55,4.55,0,0,0,16.5,13.62ZM12,4.09A2.11,2.11,0,0,1,14.11,6,2.08,2.08,0,0,1,12,7.91,2.09,2.09,0,0,1,9.89,6,2.08,2.08,0,0,1,12,4.09Z"/>
    </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M15.2,5.2H8.8a.78.78,0,0,0-.8.8V17.2a.78.78,0,0,0,.8.8h6.4a.78.78,0,0,0,.8-.8V6A.78.78,0,0,0,15.2,5.2Zm-3,12a1,1,0,1,1,1-1,1,1,0,0,1-1,1Zm3.4-3.6H8.4V7.6h6.4Z"/>
        <path d="M9.1,4.2,8.8,3.8a.76.76,0,0,0-1.1,0L7.4,4.2a.85.85,0,0,0,0,1.1L7.8,6,7.5,6.4a2,2,0,0,0,0,2.8l.3.4v4.8l-.3.4a2,2,0,0,0,0,2.8l.3.4L7.4,22a.85.85,0,0,0,0,1.1l.3.4a.76.76,0,0,0,1.1,0l.3-.4a.85.85,0,0,0,0-1.1L8.8,21l.4-.3V6l-.4-.3Z"/>
        <path d="M14.9,4.2l.3.4a.85.85,0,0,0,0-1.1L14.9,3.1l-.4.3L12,6h0l2.9,2.9.4.3a.85.85,0,0,0,1.1,0l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3Z"/>
        <path d="M14.9,23.8l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3,2.9-2.9V18l-2.5-2.5h0l-2.9-2.9V7.8l2.9-2.9.4-.3V4.2l-.3-.4a.76.76,0,0,0-1.1,0l-.3.4a.85.85,0,0,0,0,1.1l.4.3V19.4l-.4.3a.85.85,0,0,0,0,1.1l.3.4a.76.76,0,0,0,1.1,0Z"/>
        <path d="M14.9,4.2l.3.4a.85.85,0,0,0,0-1.1L14.9,3.1l-.4.3L12,6h0l2.9,2.9.4.3a.85.85,0,0,0,1.1,0l.3-.4a.76.76,0,0,0,0-1.1l-.4-.3Z" transform="translate(24) scale(-1, 1)"/>
    </svg>
);

export function SearchInitializer() {
  const searchParams = useSearchParams();
  const { setSearchTerm } = useSearch();

  useEffect(() => {
    const query = searchParams.get('q');
    setSearchTerm(query || '');
  }, [searchParams, setSearchTerm]);

  return null; 
}

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

const InstallButton = ({ isMobile = false }) => {
    const { isInstallable, promptInstall, isApple } = usePwa();

    if (isApple) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant={isMobile ? "ghost" : "outline"} className={cn(isMobile && "text-muted-foreground hover:text-primary w-full justify-start p-0 h-auto", "gap-2")}>
                        <AppleIcon className="h-5 w-5" /> Obtenir pour iPhone
                    </Button>
                </DialogTrigger>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Installer l'application sur iOS</DialogTitle>
                        <DialogDescription>
                            Pour installer l'application sur votre iPhone ou iPad, suivez ces étapes simples :
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <p>1. Appuyez sur le bouton de Partage dans la barre d'outils de Safari.</p>
                        <div className="flex justify-center"><Share className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                        <p>2. Faites défiler vers le bas et sélectionnez "Ajouter à l'écran d'accueil".</p>
                        <div className="flex justify-center"><PlusSquare className="h-8 w-8 p-2 bg-gray-200 text-gray-800 rounded-md"/></div>
                        <p>3. Appuyez sur "Ajouter" pour confirmer.</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (isInstallable) {
        return (
            <Button onClick={promptInstall} variant={isMobile ? "ghost" : "outline"} className={cn(isMobile && "text-muted-foreground hover:text-primary w-full justify-start p-0 h-auto", "gap-2")}>
                <AndroidIcon className="h-5 w-5" /> Obtenir pour Android
            </Button>
        )
    }

    return null;
}


export function SiteHeader() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markAllAsRead, getUnreadCount } = useNotifications();
  const [isClient, setIsClient] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  
  const { searchTerm, setSearchTerm, searchResults, setSearchResults } = useSearch();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setIsClient(true);
    const fetchSiteInfo = async () => {
      const docRef = doc(db, "settings", "siteInfo");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSiteInfo(docSnap.data() as SiteInfo);
      }
    };
    fetchSiteInfo();
  }, []);

  useEffect(() => {
    // Hide suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim() === '') {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearchFocused(false);
    // Navigate to a search results page or apply filter on the current page
    // Here, we assume the main page will handle the `q` query param
    router.push(`/?q=${encodeURIComponent(searchTerm)}#collection`);
  };
  
  const clientNotifications = notifications.filter(n => n.recipient === 'client' && n.userEmail === user?.email);
  const unreadClientNotifications = getUnreadCount('client', user?.email);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <AnnouncementBanner />
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="LE QG DE LA SAPE Logo" width={40} height={40} className="rounded-full object-cover" />
              <span className="font-headline text-xl font-bold tracking-wide hidden sm:inline-block animate-light-show">LE QG DE LA SAPE</span>
            </Link>
        </div>

        <nav className="hidden md:flex items-center gap-2">
            <InstallButton />
        </nav>

        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-sm relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className='relative'>
                <Input 
                  type="search"
                  name="q"
                  placeholder="Rechercher un article..."
                  className="w-full pl-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </form>
            {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    <ul>
                        {searchResults.map(product => (
                            <li key={product.id}>
                                <Link 
                                    href={`/products/${product.id}`}
                                    className="flex items-center gap-4 p-3 hover:bg-accent"
                                    onClick={() => {
                                        setIsSearchFocused(false);
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }}
                                >
                                    <Image 
                                        src={product.imageUrls?.[0] || 'https://placehold.co/40x40.png'} 
                                        alt={product.name} 
                                        width={40} 
                                        height={40} 
                                        className="rounded-sm"
                                    />
                                    <div className='flex-grow'>
                                        <p className="font-semibold text-sm">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{Math.round(product.price)} FCFA</p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {siteInfo?.whatsappNumber && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`https://wa.me/${siteInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent("Bonjour ! J'ai une question concernant vos produits.")}`} target="_blank" rel="noopener noreferrer" aria-label="Contacter sur WhatsApp">
                  <FaWhatsapp className="h-6 w-6 text-green-500" />
                </a>
              </Button>
            )}
          
          <div className="hidden md:flex items-center gap-1">
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
                
                <Button variant="ghost" size="icon" asChild>
                  <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/account'}>
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
                    <Link href="/login">Se Connecter</Link>
                </Button>
                <Button asChild>
                    <Link href="/register">S'inscrire</Link>
                </Button>
              </>
            ) : null}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Shopping cart with ${cartItemCount} items`}>
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {cartItemCount}
                    </span>
                  )}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle className="text-2xl font-headline">Mon Panier</SheetTitle>
              </SheetHeader>
              {cart.length > 0 ? (
                <>
                  <ScrollArea className="flex-grow -mx-6">
                    <div className="px-6 space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id + JSON.stringify(item.variant)} className="flex items-start gap-4">
                        <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image src={item.product.imageUrls?.[0] || 'https://placehold.co/100x100.png'} alt={item.product.name} fill objectFit="cover" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-semibold text-sm">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.variant.size}, {item.variant.color}</p>
                          <p className="text-sm font-medium my-1">{Math.round(item.product.price)} FCFA</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}>
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span>{item.quantity}</span>
                            <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}>
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeFromCart(item.product.id, item.variant)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    </div>
                  </ScrollArea>
                  <SheetFooter className="mt-auto pt-6 border-t">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between font-semibold">
                        <span>Sous-total</span>
                        <span>{Math.round(subtotal)} FCFA</span>
                      </div>
                      <SheetClose asChild>
                        <Button asChild size="lg" className="w-full">
                          <Link href="/cart">Passer la commande</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </SheetFooter>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  <p className="mt-4 text-lg font-semibold">Votre panier est vide</p>
                  <p className="text-sm text-muted-foreground">Ajoutez des articles pour commencer.</p>
                   <SheetClose asChild>
                      <Button asChild className="mt-6">
                        <Link href="/">Continuer les achats</Link>
                      </Button>
                    </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>
          
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col p-4 gap-4">
             <Separator />
             <InstallButton isMobile={true} />
             <Separator />
             {isClient && isAuthenticated ? (
                <>
                    <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/account'} onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">
                        Mon compte
                    </Link>
                    <Button variant="ghost" className="justify-start p-0 h-auto" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Déconnecter</Button>
                </>
             ) : isClient ? (
                <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">Se Connecter</Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-foreground">S'inscrire</Link>
                </>
             ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}

    