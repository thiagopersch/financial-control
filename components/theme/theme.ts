'use client';

import { createTheme, type PaletteColorOptions } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';

/**
 * Tema MUI com a identidade visual do app (antes: tokens shadcn em
 * `globals.css`): primária esmeralda, neutros, cantos de ~7px, Inter no corpo
 * e Outfit nos títulos. `cssVariables` + `colorSchemeSelector: 'class'` faz o
 * dark mode trocar só a classe `.dark` no <html> — sem re-render nem flash —
 * e mantém os utilitários `dark:` do Tailwind (layout) funcionando.
 */

declare module '@mui/material/styles' {
  interface Palette {
    income: Palette['primary'];
    expense: Palette['primary'];
    neutral: Palette['primary'];
    pending: Palette['primary'];
    overdue: Palette['primary'];
    paid: Palette['primary'];
    dueSoon: Palette['primary'];
  }
  interface PaletteOptions {
    income?: PaletteColorOptions;
    expense?: PaletteColorOptions;
    neutral?: PaletteColorOptions;
    pending?: PaletteColorOptions;
    overdue?: PaletteColorOptions;
    paid?: PaletteColorOptions;
    dueSoon?: PaletteColorOptions;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    income: true;
    expense: true;
    neutral: true;
    pending: true;
    overdue: true;
    paid: true;
    dueSoon: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}

const EMERALD = { 500: '#00bc7d', 600: '#009966', 700: '#007a55', 800: '#006045' };
const RED = { 400: '#ff6467', 600: '#e7000b' };
const AMBER = { 400: '#fbbf24', 700: '#b45309' };
const ORANGE = { 400: '#fb923c', 700: '#c2410c' };

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class', cssVarPrefix: 'mui' },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: EMERALD[700],
          light: EMERALD[600],
          dark: EMERALD[800],
          contrastText: '#ecfdf5',
        },
        secondary: { main: '#52525c', contrastText: '#fafafa' },
        error: { main: RED[600] },
        success: { main: EMERALD[600] },
        warning: { main: '#d97706' },
        info: { main: '#2563eb' },
        income: { main: EMERALD[700], contrastText: '#ecfdf5' },
        expense: { main: RED[600], contrastText: '#fff' },
        neutral: { main: '#404040', contrastText: '#fafafa' },
        pending: { main: AMBER[700], contrastText: '#fffbeb' },
        overdue: { main: RED[600], contrastText: '#fff' },
        paid: { main: EMERALD[700], contrastText: '#ecfdf5' },
        dueSoon: { main: ORANGE[700], contrastText: '#fff7ed' },
        background: { default: '#f7f7f8', paper: '#ffffff' },
        text: { primary: '#0a0a0a', secondary: '#737373' },
        divider: '#e5e5e5',
        action: { hover: 'rgba(0,0,0,0.04)', selected: 'rgba(0,122,85,0.08)' },
      },
    },
    dark: {
      palette: {
        primary: {
          main: EMERALD[600],
          light: EMERALD[500],
          dark: EMERALD[800],
          contrastText: '#ecfdf5',
        },
        secondary: { main: '#a1a1aa', contrastText: '#18181b' },
        error: { main: RED[400] },
        success: { main: EMERALD[500] },
        warning: { main: '#f59e0b' },
        info: { main: '#60a5fa' },
        income: { main: EMERALD[500], contrastText: '#022c22' },
        expense: { main: RED[400], contrastText: '#1a0000' },
        neutral: { main: '#d4d4d4', contrastText: '#0a0a0a' },
        pending: { main: AMBER[400], contrastText: '#451a03' },
        overdue: { main: RED[400], contrastText: '#1a0000' },
        paid: { main: EMERALD[500], contrastText: '#022c22' },
        dueSoon: { main: ORANGE[400], contrastText: '#431407' },
        background: { default: '#0a0a0a', paper: '#171717' },
        text: { primary: '#fafafa', secondary: '#a1a1a1' },
        divider: 'rgba(255,255,255,0.1)',
        action: { hover: 'rgba(255,255,255,0.06)', selected: 'rgba(0,188,125,0.14)' },
      },
    },
  },
  // Escala de forma do Material 3 (aproximada): 8 pequeno (chip/menu/campo), 12 médio
  // (padrão do Paper), 16 grande (card), 28 extra-grande (diálogo), pílula (botão).
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
    fontSize: 14,
    h1: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: '1.875rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-heading)',
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.015em',
    },
    h3: { fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.25rem' },
    h4: { fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.125rem' },
    h5: { fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1rem' },
    h6: { fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9375rem' },
    button: { textTransform: 'none', fontWeight: 500 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
  },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: false } },
    MuiButton: {
      // M3 "Filled button": sem sombra em repouso, raio em pílula. A elevação ao
      // passar o mouse é dada pelo próprio wrapper (components/ui/button.tsx).
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: { minWidth: 0, whiteSpace: 'nowrap', gap: 6, borderRadius: 9999 },
      },
    },
    MuiIconButton: { defaultProps: { size: 'small' } },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined', fullWidth: true } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: { root: { fontSize: '0.875rem', borderRadius: 8 } },
    },
    MuiCard: {
      // M3 usa elevação (sombra), não borda, para separar o card da página —
      // por isso não há mais `variant: 'outlined'` forçado aqui.
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { display: 'flex', flexDirection: 'column', borderRadius: 16 } },
    },
    // MuiPaper: sem override de propósito — o `backgroundImage` padrão do MUI é o
    // que dá o "surface tint" (clareamento por elevação) no dark mode; uma versão
    // anterior deste tema o removia (`backgroundImage: 'none'`), o que achatava
    // toda superfície elevada no escuro.
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 300 } },
    MuiChip: {
      // M3: chip é retângulo de raio pequeno, não pílula.
      defaultProps: { size: 'small' },
      styleOverrides: { root: { fontWeight: 500, borderRadius: 8 } },
    },
    MuiTableCell: {
      styleOverrides: { root: { fontSize: '0.875rem', paddingTop: 10, paddingBottom: 10 } },
    },
    MuiDialog: {
      defaultProps: { scroll: 'paper', fullWidth: true },
      styleOverrides: { paper: { borderRadius: 28 } },
    },
    MuiMenu: {
      defaultProps: { elevation: 3 },
      styleOverrides: { paper: { borderRadius: 8 } },
    },
    MuiPopover: {
      styleOverrides: { paper: { borderRadius: 8 } },
    },
    MuiSkeleton: { defaultProps: { animation: 'wave' } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 999 } } },
  },
});
