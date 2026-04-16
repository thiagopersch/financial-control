"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserButton } from "@/components/user-button";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export function DashboardShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string | null | undefined;
}) {
  const { isCollapsed, isOpen, onOpen, onClose } = useSidebar();

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

      <main
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isCollapsed ? "md:pl-[72px]" : "md:pl-72",
        )}
      >
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-8 dark:bg-slate-950">
          <div className="flex items-center gap-x-2 md:hidden">
            <Button onClick={onOpen} variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
            <span className="font-bold text-indigo-600">{process.env.NEXT_PUBLIC_APP_NAME}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-x-4">
            <ModeToggle />
            <span className="hidden text-sm font-medium sm:inline-block">{userName}</span>
            <UserButton />
          </div>
        </header>
        <div className="flex-1 bg-slate-50 p-4 md:p-8 dark:bg-slate-900/50">{children}</div>
      </main>
    </div>
  );
}
