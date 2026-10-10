'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart3, ChartPie, LineChart as LineChartIcon, MoreVertical } from 'lucide-react';

export type ChartVisualType =
  'default' | 'line' | 'bar-vertical' | 'bar-horizontal' | 'pie' | 'donut';

/** Visualizações oferecidas no menu (todas exceto a `default` própria de cada gráfico). */
export type ChartAltType = Exclude<ChartVisualType, 'default'>;

const OPTIONS: { value: ChartAltType; label: string; icon: React.ElementType }[] = [
  { value: 'line', label: 'Linha', icon: LineChartIcon },
  { value: 'bar-vertical', label: 'Barra Vertical', icon: BarChart3 },
  { value: 'bar-horizontal', label: 'Barra Horizontal', icon: BarChart3 },
  { value: 'pie', label: 'Pizza', icon: ChartPie },
  { value: 'donut', label: 'Rosca', icon: ChartPie },
];

interface ChartTypeSwitcherProps {
  value: ChartVisualType;
  onChange: (value: ChartAltType) => void;
}

export function ChartTypeSwitcher({ value, onChange }: ChartTypeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Alterar visualização</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-max">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="whitespace-nowrap"
          >
            <opt.icon className="mr-2 h-4 w-4" />
            {opt.label}
            {value === opt.value && <span className="ml-auto pl-4 text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
