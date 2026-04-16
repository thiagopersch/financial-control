"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function MonthSelector() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentMonth = searchParams.get("month") || (mounted ? format(new Date(), "yyyy-MM") : "");

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", value);
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date(currentYear, i, 1);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR }),
    };
  });

  return (
    <div className="flex items-center gap-2 max-md:w-full">
      <span className="text-muted-foreground hidden text-sm font-medium sm:inline-block">
        Período:
      </span>
      <Select value={currentMonth} onValueChange={onChange}>
        <SelectTrigger className="w-full border-none bg-white shadow-sm dark:bg-slate-900">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="year">Ano Completo {currentYear}</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              <span className="capitalize">{month.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
