
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, User, ShoppingBag, Settings, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/account', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Profil', icon: User },
  { href: '/account/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/account/settings', label: 'Adresses', icon: Home },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
       <Button
          variant='ghost'
          className="w-full justify-start mt-4"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnecter
        </Button>
    </nav>
  );
}
