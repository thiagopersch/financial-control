"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { RuleModal } from "./rule-modal";

interface RulesHeaderProps {
  categories: { id: string; name: string; type: string; color: string }[];
}

export function RulesHeader({ categories }: RulesHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Regras</h1>
        <p className="text-muted-foreground">Automatize a categorização de transações.</p>
      </div>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-indigo-600 shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 sm:w-auto dark:shadow-none"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nova Regra
      </Button>
      <RuleModal isOpen={isOpen} onClose={() => setIsOpen(false)} categories={categories} />
    </div>
  );
}
