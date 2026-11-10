'use client';

import { theme } from '@/components/theme/theme';
import { swrConfig } from '@/lib/queries/fetcher';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';
import { ptBR } from 'date-fns/locale';
import { SnackbarProvider } from 'notistack';
import { SWRConfig } from 'swr';

/** Chave do localStorage do tema (a mesma de antes da migração para MUI). */
export const COLOR_MODE_STORAGE_KEY = 'theme';

const pickerTexts = pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText;

export function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system" modeStorageKey={COLOR_MODE_STORAGE_KEY}>
      <CssBaseline enableColorScheme />
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={ptBR}
        localeText={pickerTexts}
      >
        <SnackbarProvider
          maxSnack={4}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          preventDuplicate
        >
          <SWRConfig value={swrConfig}>{children}</SWRConfig>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
