
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, UploadCloud, Users, User, Lightbulb } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: BookOpenText },
  { href: '/upload', labelKey: 'sidebar.createExam', icon: UploadCloud },
  { href: '/custom-courses/create', labelKey: 'sidebar.createCourse', icon: Lightbulb },
  { href: '/community', labelKey: 'sidebar.community', icon: Users },
  { href: '/profile', labelKey: 'sidebar.profile', icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null; // Don't show nav bar if not logged in
  }
  
  const isNavItemActive = (itemHref: string) => {
    if (itemHref === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(itemHref);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = isNavItemActive(item.href);
          return (
            <Link key={item.href} href={item.href} passHref>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-16 h-14",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-accent"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-[10px] font-medium truncate">{t(item.labelKey)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
