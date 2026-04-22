'use client';

import { Route, routeGroups } from '@/components/sidebar/routes';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Wallet } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Sidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed, toggle, onClose } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const showFullSidebar = isMobile || !isCollapsed || isHovered;

  useEffect(() => {
    const activeGroup = routeGroups.find((group) =>
      group.routes.some((route) => route.href === pathname),
    );

    if (activeGroup) {
      setExpandedGroups([activeGroup.title]);
    } else {
      setExpandedGroups([]);
    }
  }, [pathname]);

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const toggleGroup = (title: string) => {
    if (isCollapsed && !isHovered) return;
    setExpandedGroups((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [title]));
  };

  const isRouteActive = (href: string) => pathname === href;

  const isGroupActive = (routes: Route[]) => routes.some((route) => route.href === pathname);

  const renderRoute = (route: Route, showLabel: boolean) => (
    <Link
      key={route.href}
      href={route.href}
      onClick={handleLinkClick}
      className={cn(
        'group hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer justify-start rounded-lg p-3 text-sm font-medium transition-all duration-150',
        isRouteActive(route.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
      )}
    >
      <div className="flex flex-1 items-center gap-3">
        {route.icon && (
          <route.icon className={cn('h-5 w-5 shrink-0', route.color || 'text-muted-foreground')} />
        )}
        {showLabel && <span className="truncate whitespace-nowrap">{route.label}</span>}
      </div>
    </Link>
  );

  return (
    <div
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={cn(
        'bg-background text-foreground flex h-full flex-col border-r shadow-sm transition-all duration-200',
        !isMobile && 'fixed top-0 left-0 z-100 hidden md:flex',
        showFullSidebar ? 'w-auto' : 'w-[72px]',
        isMobile && 'w-full border-none shadow-none',
      )}
    >
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-6 flex min-h-12 items-center justify-between px-2 pt-4">
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center overflow-hidden transition-all',
              !showFullSidebar ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            <div className="relative mr-4 h-8 w-8 shrink-0">
              <Wallet className="h-8 w-8 text-indigo-500" />
            </div>
            <span className="text-foreground text-xl font-bold whitespace-nowrap">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>
          </Link>

          {!isMobile && (
            <Button
              onClick={toggle}
              variant="ghost"
              size="icon"
              className={cn('hover:bg-accent shrink-0', !showFullSidebar && 'mx-auto')}
            >
              {showFullSidebar ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {routeGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            const isActive = isGroupActive(group.routes);

            return (
              <div key={group.title} className="space-y-1">
                {showFullSidebar ? (
                  <>
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase transition-colors',
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <group.icon className="h-4 w-4" />
                        <span>{group.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </button>
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-150',
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
                      )}
                    >
                      {group.routes.map((route) => renderRoute(route, true))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className={cn(
                        'rounded-lg p-3 transition-colors',
                        isActive ? 'bg-accent' : 'hover:bg-accent hover:text-accent-foreground',
                      )}
                      title={group.title}
                    >
                      <group.icon
                        className={cn(
                          'h-5 w-5',
                          isActive ? 'text-accent-foreground' : 'text-muted-foreground',
                        )}
                      />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className={cn(
            'text-muted-foreground hover:text-foreground w-full justify-start',
            !showFullSidebar && 'justify-center px-0',
          )}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {showFullSidebar && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );
}
