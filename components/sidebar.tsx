"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tag,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Transações",
    icon: Wallet,
    href: "/transactions",
    color: "text-violet-500",
  },
  {
    label: "Categorias",
    icon: Tag,
    href: "/categories",
    color: "text-pink-700",
  },
  {
    label: "Fornecedores",
    icon: Truck,
    href: "/suppliers",
    color: "text-orange-700",
  },
  {
    label: "Usuários",
    icon: Users,
    href: "/users",
    color: "text-emerald-500",
  },
  {
    label: "Regras",
    icon: Zap,
    href: "/rules",
    color: "text-yellow-500",
  },
  {
    label: "Perfil",
    icon: Settings,
    href: "/profiles",
  },
];

export function Sidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed, toggle, onClose } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const showFullSidebar = isMobile || !isCollapsed || isHovered;

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={cn(
        "bg-background text-foreground flex h-full flex-col border-r shadow-sm transition-all duration-400",
        !isMobile && "fixed top-0 left-0 z-100 hidden md:flex",
        showFullSidebar ? "w-auto" : "w-[72px]",
        isMobile && "w-full border-none shadow-none",
      )}
    >
      <div className="flex-1 px-3 py-2">
        <div className="mb-10 flex min-h-12 items-center justify-between px-2">
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center overflow-hidden transition-all duration-300",
              !showFullSidebar ? "w-0 opacity-0" : "w-auto opacity-100",
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
              className={cn("hover:bg-accent shrink-0", !showFullSidebar && "mx-auto")}
            >
              {showFullSidebar ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={handleLinkClick}
              className={cn(
                "group hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer justify-start rounded-lg p-3 text-sm font-medium transition",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <div className="flex flex-1 items-center">
                <route.icon
                  className={cn("h-5 w-5 shrink-0", route.color, showFullSidebar && "mr-3")}
                />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300",
                    !showFullSidebar ? "w-0 opacity-0" : "w-auto opacity-100",
                  )}
                >
                  {route.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <Button
          onClick={() => {
            handleLinkClick();
            signOut();
          }}
          variant="ghost"
          className={cn(
            "w-full justify-start bg-red-600/25 text-red-600 hover:bg-red-600/40 hover:text-red-600",
            !showFullSidebar ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut className={cn("h-5 w-5 shrink-0", showFullSidebar && "mr-3")} />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              !showFullSidebar ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Sair
          </span>
        </Button>
      </div>
    </div>
  );
}
