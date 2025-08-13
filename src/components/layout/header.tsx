
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
      <path d="M12.02,2.5C10.36,2.5,8.82,3.43,8.06,4.72C7,5.55,6.08,7.34,6.08,8.86c0,2.44,1.83,3.61,2,3.65c0.1,0.04,0.1,0.04,0.1,0.04c-2.31,1.48-2.92,4.35-2.92,4.35c0.12,0,2.14-1.28,3.78-1.28c1.55,0,2.69,0.76,3.58,0.76c0.85,0,2.06-0.76,3.58-0.76c1.64,0,3.62,1.28,3.75,1.28c0,0-0.61-2.87-2.92-4.35c0,0,0,0,0.06,0c0.18-0.04,2-1.21,2-3.65c0-1.52-0.92-3.31-2-4.14C15.22,3.43,13.68,2.5,12.02,2.5z M12.63,4.61c0.76-0.87,2.14-1,2.8-0.2c-0.22,0.68-0.91,1.36-1.63,1.95c-0.72,0.6-1.55,1.19-2.53,0.91C11.53,6.86,11.83,5.55,12.63,4.61z"/>
    </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.47,8.39l1.49-1.49A.5.5,0,0,0,16.6,6.2l-1.5,1.5A6.47,6.47,0,0,0,12,7a6.47,6.47,0,0,0-3.1.7L7.4,6.2a.5.5,0,0,0-.71.71l1.49,1.49A6.5,6.5,0,0,0,6,12.75V15.5a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V12.75A6.5,6.5,0,0,0,15.47,8.39ZM9.5,14a.5.5,0,0,1,0-1h5a.5.5,0,0,1,0,1Zm-.75-3.5a.75.75,0,1,1,.75-.75A.75.75,0,0,1,8.75,10.5Zm6.5,0a.75.75,0,1,1,.75-.75A.75.75,0,0,1,15.25,10.5Z"/>
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

    