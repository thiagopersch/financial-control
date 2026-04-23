import { Providers } from '@/app/providers';
import { ThemeProvider } from '@/app/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
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
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
