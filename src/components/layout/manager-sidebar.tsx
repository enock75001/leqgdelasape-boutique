
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, ShoppingCart, Megaphone, LogOut, GalleryHorizontal, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';

const navItems = [
    { href: '/manager', label: 'Tableau de bord', icon: Home },
    { href: '/manager/orders', label: 'Commandes', icon: ShoppingCart },
    { href: '/manager/products', label: 'Produits', icon: Package },
    { href: '/manager/categories', label: 'Catégories', icon: LayoutGrid },
    { href: '/manager/announcements', label: 'Annonces', icon: Megaphone },
    { href: '/manager/carousel', label: 'Carrousel', icon: GalleryHorizontal },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-4 justify-between">
        <Link href="/manager" className="flex items-center gap-2">
            <Image src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="Logo" width={32} height={32} className="rounded-full object-cover" />
            <span className="font-headline text-lg font-bold">Manager</span>
        </Link>
      </div>
      <nav className="flex-grow p-4">
        <ul className='flex flex-col h-full'>
          {navItems.map((item) => (
            <li key={item.href}>
              <Button
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
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
