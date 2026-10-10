'use client';

import { useTheme } from '@/app/theme-provider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const THEME_ORDER = ['light', 'dark', 'system'] as const;
type ThemeOption = (typeof THEME_ORDER)[number];

const THEME_META: Record<ThemeOption, { label: string; icon: typeof Sun }> = {
  light: { label: 'Claro', icon: Sun },
  dark: { label: 'Escuro', icon: Moon },
  system: { label: 'Sistema', icon: Monitor },
};

const subscribe = () => () => {};

/** Alterna o tema a cada clique: Claro → Escuro → Sistema. */
export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  // O tema salvo só existe no client; antes de hidratar mostra o ícone de "Sistema".
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const current: ThemeOption = mounted ? theme : 'system';
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  const CurrentIcon = THEME_META[current].icon;
  const label = `Tema: ${THEME_META[current].label} (clique para ${THEME_META[next].label})`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={() => setTheme(next)} aria-label={label}>
          <CurrentIcon
            key={current}
            className="animate-in fade-in zoom-in-75 h-5 w-5 duration-200"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
