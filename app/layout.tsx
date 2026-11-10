import { Providers } from '@/app/providers';
import { RouteTransitionIndicator } from '@/components/route-transition-indicator';
import { COLOR_MODE_STORAGE_KEY, MuiProvider } from '@/components/theme/mui-provider';
import { WebVitals } from '@/components/web-vitals';
import { cn } from '@/lib/utils';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';

// next/font baixa as fontes no build e serve do próprio domínio (sem Google Fonts em
// runtime). Inter é variável (1 arquivo) e é a única pré-carregada; títulos usam só
// 600/700 e a mono só é baixada quando aparece na tela.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const outfitHeading = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700'],
  display: 'swap',
  preload: false,
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? '.:: Controle Financeiro ::.',
  description:
    'Gerencie as finanças da sua empresa com inteligência. Transações, categorias, fornecedores e muito mais.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Evita que o teclado virtual encolha o visualViewport no mobile, o que
  // deixa popups posicionados (Autocomplete, Menu) instáveis durante a digitação.
  interactiveWidget: 'overlays-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      suppressHydrationWarning
      className={cn('h-full antialiased', inter.variable, outfitHeading.variable, mono.variable)}
    >
      <body className="flex min-h-full flex-col">
        {/* Aplica a classe .dark/.light antes da pintura (sem flash de tema). */}
        <InitColorSchemeScript
          attribute="class"
          defaultMode="system"
          modeStorageKey={COLOR_MODE_STORAGE_KEY}
        />
        <WebVitals />
        <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
          <MuiProvider>
            <Providers>
              <Suspense fallback={null}>
                <RouteTransitionIndicator />
              </Suspense>
              {children}
            </Providers>
          </MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
