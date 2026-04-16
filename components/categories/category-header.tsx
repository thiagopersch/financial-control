"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CategoryModal } from "./category-modal";

interface CategoryHeaderProps {
  userRole?: string;
}

export function CategoryHeader({ userRole }: CategoryHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canModify = userRole !== "VIEWER";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Categorias
        </h1>
        <p className="text-muted-foreground">Gerencie as categorias de suas transações.</p>
      </div>
      {canModify && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-full bg-indigo-600 shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 sm:w-auto dark:shadow-none"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      )}

      <CategoryModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
