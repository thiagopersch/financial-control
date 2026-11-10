'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';
import { Monitor, Moon, Sun } from 'lucide-react';

const THEME_ORDER = ['light', 'dark', 'system'] as const;
type ThemeOption = (typeof THEME_ORDER)[number];

const THEME_META: Record<ThemeOption, { label: string; icon: typeof Sun }> = {
  light: { label: 'Claro', icon: Sun },
  dark: { label: 'Escuro', icon: Moon },
  system: { label: 'Sistema', icon: Monitor },
};

/** Alterna o tema a cada clique: Claro → Escuro → Sistema. */
export function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  // `mode` só existe depois de hidratar; antes disso mostra o ícone de "Sistema".
  const current: ThemeOption = mode ?? 'system';
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  const CurrentIcon = THEME_META[current].icon;
  const label = `Tema: ${THEME_META[current].label} (clique para ${THEME_META[next].label})`;

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => setMode(next)}
        aria-label={label}
        sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
      >
        <CurrentIcon className="h-5 w-5" />
      </IconButton>
    </Tooltip>
  );
}
