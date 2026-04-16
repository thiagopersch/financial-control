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

interface MonthSelectorProps {
  availableRange?: {
    minDate: Date | string | null;
    maxDate: Date | string | null;
  };
}

export function MonthSelector({ availableRange }: MonthSelectorProps) {
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
  const minDate = availableRange?.minDate ? new Date(availableRange.minDate) : new Date();
  const maxDate = availableRange?.maxDate ? new Date(availableRange.maxDate) : new Date();

  const startYear = Math.min(minDate.getFullYear(), currentYear);
  const endYear = Math.max(maxDate.getFullYear(), currentYear);

  const months = [];
  for (let year = startYear; year <= endYear; year++) {
    // Para o ano atual ou anos anteriores, mostramos todos os meses (11 = Dezembro)
    // Para anos futuros, mostramos apenas até o mês da última transação registrada
    const endMonth = year <= currentYear ? 11 : year === endYear ? maxDate.getMonth() : 11;

    for (let month = 0; month <= endMonth; month++) {
      const date = new Date(year, month, 1);
      months.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy", { locale: ptBR }),
      });
    }
  }

  // Ordenar do mais recente para o mais antigo e garantir que o mês atual e futuros apareçam
  months.sort((a, b) => b.value.localeCompare(a.value));

  return (
    <div className="flex items-center gap-2 max-md:w-full">
      <span className="text-muted-foreground hidden text-sm font-medium sm:inline-block">
        Período:
      </span>
      <Select value={currentMonth} onValueChange={onChange}>
        <SelectTrigger className="w-full cursor-pointer border shadow-sm">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo o Período</SelectItem>
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
