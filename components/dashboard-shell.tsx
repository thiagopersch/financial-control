'use client';

import { ModeToggle } from '@/components/mode-toggle';
import { flatRoutes } from '@/components/sidebar/routes';
import { Sidebar } from '@/components/sidebar/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UserButton } from '@/components/user-button';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isOpen, onOpen, onClose } = useSidebar();
  const pathname = usePathname();
  const route = flatRoutes.find((route) => route.href === pathname);
  const title = route?.label.toUpperCase();

  return (
    <div className="relative h-full">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="border-none p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      <main className={cn('flex min-h-screen flex-col', isCollapsed ? 'md:pl-[72px]' : 'md:pl-72')}>
        <header className="bg-background text-foreground sticky top-0 z-50 flex h-16 items-center justify-between border-b px-4 md:px-8">
          <div className="flex items-center gap-x-2 md:hidden">
            <Button onClick={onOpen} variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <span className="text-muted-foreground px-4 text-lg font-bold">{title}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-x-4">
            <ModeToggle />
            <UserButton />
          </div>
        </header>
        <div className="bg-background text-foreground flex-1 px-4 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
