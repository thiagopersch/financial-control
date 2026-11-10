'use client';

import { Route, routeGroups, topLevelRoutes } from '@/components/sidebar/routes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/hooks/use-sidebar';
import { EXEMPT_RESOURCES, resourceFromHref } from '@/lib/permissions/catalog';
import { hasPermission } from '@/lib/permissions/has-permission';
import { cn } from '@/lib/utils';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { ChevronDown, ChevronRight, LogOut, Wallet } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Sidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const isCollapsed = useSidebar((s) => s.isCollapsed);
  const onClose = useSidebar((s) => s.onClose);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;

  const canViewRoute = (route: Route) => {
    const resource = resourceFromHref(route.href);
    return EXEMPT_RESOURCES.has(resource) || hasPermission(permissions, resource, 'VIEW');
  };

  const visibleRouteGroups = routeGroups
    .map((group) => ({
      ...group,
      routes: group.routes.filter(canViewRoute),
    }))
    .filter((group) => group.routes.length > 0);

  const showFullSidebar = isMobile || !isCollapsed;

  useEffect(() => {
    const activeGroup = routeGroups.find((group) =>
      group.routes.some((route) => route.href === pathname),
    );

    const timer = setTimeout(() => {
      if (activeGroup) {
        setExpandedGroups([activeGroup.title]);
      } else {
        setExpandedGroups([]);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [title]));
  };

  const isRouteActive = (href: string) => pathname === href;

  const isGroupActive = (routes: Route[]) => routes.some((route) => route.href === pathname);

  // Item de navegação sobre `ListItemButton` (M3: estado selecionado/hover/foco
  // e ripple já vêm do componente, em vez de um <div>/<button> com classes
  // `bg-accent`/`text-accent-foreground` escritas à mão).
  const renderRoute = (route: Route, showLabel: boolean) => {
    const active = isRouteActive(route.href);
    const item = (
      <ListItemButton
        key={route.href}
        component={Link}
        href={route.href}
        onClick={handleLinkClick}
        selected={active}
        sx={{
          borderRadius: 2,
          py: 1,
          px: 1.5,
          justifyContent: showLabel ? 'flex-start' : 'center',
        }}
      >
        <ListItemIcon sx={{ minWidth: showLabel ? 36 : 0, justifyContent: 'center' }}>
          {route.icon && <route.icon className={cn('h-5 w-5 shrink-0', route.color)} />}
        </ListItemIcon>
        {showLabel && (
          <ListItemText
            primary={route.label}
            slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }}
          />
        )}
      </ListItemButton>
    );

    if (showLabel) return item;

    return (
      <Tooltip key={route.href}>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right">{route.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        transition: 'width .2s ease',
      }}
      className={cn(
        !isMobile && 'fixed top-0 left-0 z-30 hidden border-r md:flex',
        showFullSidebar ? 'w-72' : 'w-[72px]',
        isMobile && 'w-full border-none',
      )}
    >
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-6 flex min-h-12 items-center px-2 pt-4">
          <div className="flex items-center overflow-hidden">
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className="relative mr-4 h-8 w-8 shrink-0"
            >
              <Wallet className="text-primary h-8 w-8" />
            </Link>
            <Typography
              variant="h6"
              noWrap
              sx={{
                transition: 'opacity .2s, width .2s',
                width: showFullSidebar ? 'auto' : 0,
                opacity: showFullSidebar ? 1 : 0,
              }}
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Typography>
          </div>
        </div>

        <List disablePadding sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {topLevelRoutes.map((route) => renderRoute(route, showFullSidebar))}
        </List>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {visibleRouteGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            const isActive = isGroupActive(group.routes);

            return (
              <Box key={group.title}>
                {showFullSidebar ? (
                  <>
                    <ListItemButton
                      onClick={() => toggleGroup(group.title)}
                      sx={{ borderRadius: 2, py: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <group.icon className="h-4 w-4" />
                      </ListItemIcon>
                      <ListItemText
                        primary={group.title}
                        slotProps={{
                          primary: {
                            variant: 'overline',
                            sx: { color: isActive ? 'text.primary' : 'text.secondary' },
                          },
                        }}
                      />
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </ListItemButton>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List disablePadding sx={{ pl: 0.5 }}>
                        {group.routes.map((route) => renderRoute(route, true))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <Popover>
                    <div className="flex flex-col items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <IconButton
                              color={isActive ? 'primary' : 'default'}
                              sx={isActive ? { bgcolor: 'action.selected' } : undefined}
                            >
                              <group.icon className="h-5 w-5" />
                            </IconButton>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">{group.title}</TooltipContent>
                      </Tooltip>
                    </div>
                    <PopoverContent side="right" align="start" className="w-56 p-1.5">
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ px: 1, py: 0.5, display: 'block' }}
                      >
                        {group.title}
                      </Typography>
                      <List disablePadding>
                        {group.routes.map((route) => renderRoute(route, true))}
                      </List>
                    </PopoverContent>
                  </Popover>
                )}
              </Box>
            );
          })}
        </List>
      </div>

      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button
          variant="destructive"
          className={cn('w-full justify-start', !showFullSidebar && 'justify-center px-0')}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {showFullSidebar && <span>Sair</span>}
        </Button>
      </Box>
    </Box>
  );
}
