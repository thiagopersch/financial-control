import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/app/theme-provider';
import { RouteTransitionIndicator } from '@/components/route-transition-indicator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import './globals.css';

const outfitHeading = Outfit({ subsets: ['latin'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? '.:: Controle Financeiro ::.',
  description:
    'Gerencie as finanças da sua empresa com inteligência. Transações, categorias, fornecedores e muito mais.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Evita que o teclado virtual encolha o visualViewport no mobile: isso fazia
  // popups posicionados por floating-ui (ex: Combobox/SelectSearch) se
  // deslocarem durante o gesto de toque, fazendo o tap em uma opção "errar" o
  // alvo e ser interpretado como clique fora (fechando sem selecionar).
  interactiveWidget: 'overlays-content',
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
      className={cn(
        'h-full',
        'antialiased',
        'font-sans',
        inter.variable,
        outfitHeading.variable,
        mono.variable,
      )}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <Providers>
            <Suspense fallback={null}>
              <RouteTransitionIndicator />
            </Suspense>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
